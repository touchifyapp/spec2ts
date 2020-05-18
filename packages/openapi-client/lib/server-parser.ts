import * as ts from "typescript";
import * as core from "@spec2ts/core";

import type {
    ServerObject,
    ServerVariableObject
} from "openapi3-ts";

import { camelCase } from "./util";

export function parseServers(servers: ServerObject[]): ts.ObjectLiteralExpression {
    const props = servers.map((server, i) => [serverName(server, i), generateServerExpression(server)] as [string, ts.Expression]);
    return core.createObjectLiteral(props);
}

export function defaultBaseUrl(servers: ServerObject[]): ts.StringLiteral {
    return ts.createStringLiteral(defaultUrl(servers[0]));
}

function serverName(server: ServerObject, index: number): string {
    return server.description ?
        camelCase(server.description.replace(/\W+/, " ")) :
        `server${index + 1}`;
}

function generateServerExpression(server: ServerObject): ts.Expression {
    return server.variables ?
        createServerFunction(server.url, server.variables) :
        ts.createStringLiteral(server.url);
}

function createServerFunction(template: string, vars: Record<string, ServerVariableObject>): ts.ArrowFunction {
    const params = [
        core.createParameter(
            core.createObjectBinding(
                Object.entries(vars || {}).map(([name, value]) => {
                    return {
                        name,
                        initializer: createLiteral(value.default),
                    };
                })
            ),
            {
                type: ts.createTypeLiteralNode(
                    Object.entries(vars || {}).map(([name, value]) => {
                        return core.createPropertySignature({
                            name,
                            type: value.enum ?
                                ts.createUnionTypeNode(createUnion(value.enum)) :
                                ts.createUnionTypeNode([
                                    core.keywordType.string,
                                    core.keywordType.number,
                                    core.keywordType.boolean,
                                ]),
                        });
                    })
                ),
            }
        ),
    ];

    return core.createArrowFunction(params, createTemplate(template));
}


function createUnion(strs: Array<string | boolean | number>): ts.LiteralTypeNode[] {
    return strs.map((e) => ts.createLiteralTypeNode(createLiteral(e)));
}

function createTemplate(url: string): ts.TemplateLiteral {
    const tokens = url.split(/{([\s\S]+?)}/g);
    const spans: ts.TemplateSpan[] = [];
    const len = tokens.length;

    for (let i = 1; i < len; i += 2) {
        spans.push(
            ts.createTemplateSpan(
                ts.createIdentifier(tokens[i]),
                (i === len - 2 ? ts.createTemplateTail : ts.createTemplateMiddle)(tokens[i + 1])
            )
        );
    }

    return ts.createTemplateExpression(ts.createTemplateHead(tokens[0]), spans);
}

function createLiteral(v: string | boolean | number): ts.StringLiteral | ts.BooleanLiteral | ts.NumericLiteral {
    switch (typeof v) {
        case "string":
            return ts.createStringLiteral(v);
        case "boolean":
            return v ? ts.createTrue() : ts.createFalse();
        case "number":
            return ts.createNumericLiteral(String(v));
    }
}

function defaultUrl(server?: ServerObject): string {
    if (!server) return "/";

    const { url, variables } = server;
    if (!variables) return url;

    return url.replace(
        /\{(.+?)\}/g,
        (m, name) => variables[name] ? String(variables[name].default) : m
    );
}

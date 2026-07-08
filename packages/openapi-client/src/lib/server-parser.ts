import * as ts from "typescript";
import * as core from "@spec2ts/core";

import type {
    ServerObject,
    ServerVariableObject
} from "openapi3-ts/oas31";

import { camelCase } from "./util";

export function parseServers(servers: ServerObject[]): ts.ObjectLiteralExpression {
    const props = servers.map((server, i) => [serverName(server, i), generateServerExpression(server)] as [string, ts.Expression]);
    return core.createObjectLiteral(props);
}

export function defaultBaseUrl(servers: ServerObject[]): ts.StringLiteral {
    return ts.factory.createStringLiteral(defaultUrl(servers[0]));
}

function serverName(server: ServerObject, index: number): string {
    return server.description ?
        camelCase(server.description.replace(/\W+/, " ")) :
        `server${index + 1}`;
}

function generateServerExpression(server: ServerObject): ts.Expression {
    return server.variables ?
        createServerFunction(server.url, server.variables) :
        ts.factory.createStringLiteral(server.url);
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
                type: ts.factory.createTypeLiteralNode(
                    Object.entries(vars || {}).map(([name, value]) => {
                        return core.createPropertySignature({
                            name,
                            type: value.enum ?
                                ts.factory.createUnionTypeNode(createUnion(value.enum)) :
                                ts.factory.createUnionTypeNode([
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
    return strs.map((e) => ts.factory.createLiteralTypeNode(createLiteral(e)));
}

function createTemplate(url: string): ts.TemplateLiteral {
    const tokens = url.split(/{([\s\S]+?)}/g);
    const spans: ts.TemplateSpan[] = [];
    const len = tokens.length;

    for (let i = 1; i < len; i += 2) {
        spans.push(
            ts.factory.createTemplateSpan(
                ts.factory.createIdentifier(tokens[i]),
                (i === len - 2 ? ts.factory.createTemplateTail : ts.factory.createTemplateMiddle)(tokens[i + 1])
            )
        );
    }

    return ts.factory.createTemplateExpression(ts.factory.createTemplateHead(tokens[0]), spans);
}

function createLiteral(v: string | boolean | number): ts.StringLiteral | ts.BooleanLiteral | ts.NumericLiteral {
    switch (typeof v) {
        case "string":
            return ts.factory.createStringLiteral(v);
        case "boolean":
            return v ? ts.factory.createTrue() : ts.factory.createFalse();
        case "number":
            return ts.factory.createNumericLiteral(String(v));
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

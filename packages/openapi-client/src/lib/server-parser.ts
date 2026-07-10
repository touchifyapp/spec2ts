import type { ServerObject, ServerVariableObject } from "openapi3-ts/oas31";
import type * as ts from "typescript/unstable/ast";

import * as core from "@spec2ts/core";
import * as factory from "typescript/unstable/ast/factory";

import { camelCase } from "./util";

export function parseServers(servers: ServerObject[]): ts.ObjectLiteralExpression {
    const props = servers.map((server, i) => [serverName(server, i), generateServerExpression(server)] as [string, ts.Expression]);
    return core.createObjectLiteral(props);
}

export function defaultBaseUrl(servers: ServerObject[]): ts.StringLiteral {
    return core.createStringLiteral(defaultUrl(servers[0]));
}

function serverName(server: ServerObject, index: number): string {
    return server.description ? camelCase(server.description.replace(/\W+/, " ")) : `server${index + 1}`;
}

function generateServerExpression(server: ServerObject): ts.Expression {
    return server.variables ? createServerFunction(server.url, server.variables) : core.createStringLiteral(server.url);
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
                }),
            ),
            {
                type: factory.createTypeLiteralNode(
                    Object.entries(vars || {}).map(([name, value]) => {
                        return core.createPropertySignature({
                            name,
                            type: value.enum
                                ? factory.createUnionTypeNode(createUnion(value.enum))
                                : factory.createUnionTypeNode([core.keywordType.string, core.keywordType.number, core.keywordType.boolean]),
                        });
                    }),
                ),
            },
        ),
    ];

    return core.createArrowFunction(params, createTemplate(template));
}

function createUnion(strs: Array<string | boolean | number>): ts.LiteralTypeNode[] {
    return strs.map((e) => factory.createLiteralTypeNode(createLiteral(e)));
}

function createTemplate(url: string): ts.Expression {
    const tokens = url.split(/{([\s\S]+?)}/g);
    const spans: Array<{ expression: ts.Expression; literal: string }> = [];
    const len = tokens.length;

    for (let i = 1; i < len; i += 2) {
        spans.push({ expression: factory.createIdentifier(tokens[i]), literal: tokens[i + 1] });
    }

    return core.createTemplateString(tokens[0], spans);
}

function createLiteral(v: string | boolean | number): ts.StringLiteral | ts.BooleanLiteral | ts.NumericLiteral {
    switch (typeof v) {
        case "string":
            return core.createStringLiteral(v);
        case "boolean":
            return core.createBooleanLiteral(v);
        case "number":
            return core.createNumericLiteral(v);
    }
}

function defaultUrl(server?: ServerObject): string {
    if (!server) return "/";

    const { url, variables } = server;
    if (!variables) return url;

    return url.replace(/\{(.+?)\}/g, (m, name) => (variables[name] ? String(variables[name].default) : m));
}

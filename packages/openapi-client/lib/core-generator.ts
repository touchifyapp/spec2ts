import * as ts from "typescript";
import * as core from "@spec2ts/core";

import type {
    OpenAPIObject,
    ParameterObject,
    PathItemObject,
    OperationObject
} from "openapi3-ts";

import {
    ParserContext,
    resolveReference
} from "@spec2ts/jsonschema/lib/core-parser";

import {
    parseServers,
    defaultBaseUrl
} from "./server-parser";

import {
    Method,
    OApiGeneratorContext,
    isMethod,
    parseOperation
} from "./core-parser";

import { camelCase } from "./util";

export type Formatter = "space" | "pipe" | "deep" | "explode" | "form";

//#region Public

export function generateServers(file: ts.SourceFile, { servers }: OpenAPIObject): void {
    servers = servers || [];

    const serversConst = core.findFirstVariableDeclaration(file.statements, "servers");
    const defaultsConst = core.findFirstVariableDeclaration(file.statements, "defaults");

    if (!serversConst || !defaultsConst) {
        throw new Error("Invalid template: missing servers or defaults const");
    }

    serversConst.initializer = parseServers(servers);

    core.changePropertyValue(
        (defaultsConst.initializer as ts.ObjectLiteralExpression) || ts.createObjectLiteral(),
        "baseUrl",
        defaultBaseUrl(servers)
    );
}

export function generateDefaults(file: ts.SourceFile, context: OApiGeneratorContext): void {
    if (context.options.importFetch) {
        const defaultsConst = core.findFirstVariableDeclaration(file.statements, "defaults");
        if (!defaultsConst) {
            throw new Error("Invalid template: missing defaults const");
        }

        file.statements = ts.createNodeArray([
            core.createDefaultImportDeclaration({
                moduleSpecifier: context.options.importFetch,
                name: "fetch",
                bindings: ["RequestInit", "Headers"]
            }),
            core.createNamespaceImportDeclaration({
                moduleSpecifier: "form-data",
                name: "FormData"
            }),
            ...file.statements
        ]);

        core.upsertPropertyValue(
            (defaultsConst.initializer as ts.ObjectLiteralExpression) || ts.createObjectLiteral(),
            "fetch", core.toExpression("fetch")
        );
    }

}

export function generateFunctions(file: ts.SourceFile, spec: OpenAPIObject, context: OApiGeneratorContext): void {
    const functions: ts.FunctionDeclaration[] = [];

    for (const path in spec.paths) {
        const item = resolveReference<PathItemObject>(spec.paths[path], context);

        for (const verb in item) {
            const method = verb.toUpperCase();
            if (isMethod(method)) {
                functions.push(
                    generateFunction(path, item, method, item[verb], context)
                );
            }
        }
    }

    file.statements = core.appendNodes(
        file.statements,
        ...context.aliases,
        ...functions
    );
}

function generateFunction(path: string, item: PathItemObject, method: Method, operation: OperationObject, context: ParserContext): ts.FunctionDeclaration {
    const {
        name,
        query,
        header,
        paramsVars,
        args,
        bodyMode,
        bodyVar,
        response,
        responseVoid,
        responseJSON
    } = parseOperation(path, item, method, operation, context);

    const qs = generateQs(query, paramsVars);
    const url = generateUrl(path, qs);

    const init: ts.ObjectLiteralElementLike[] = [
        ts.createSpreadAssignment(ts.createIdentifier("options")),
    ];

    if (method !== "GET") {
        init.push(
            ts.createPropertyAssignment("method", ts.createStringLiteral(method))
        );
    }

    if (bodyVar) {
        init.push(
            core.createPropertyAssignment("body", ts.createIdentifier(bodyVar))
        );
    }

    if (header.length) {
        init.push(
            ts.createPropertyAssignment(
                "headers",
                ts.createObjectLiteral(
                    [
                        ts.createSpreadAssignment(
                            ts.createPropertyAccessChain(
                                ts.createIdentifier("options"),
                                core.questionDotToken,
                                ts.createIdentifier("headers")
                            )
                        ),
                        ...header.map(({ name }) =>
                            core.createPropertyAssignment(
                                name,
                                ts.createIdentifier(paramsVars[name])
                            )
                        ),
                    ],
                    true
                )
            )
        );
    }

    const fetchArgs: ts.Expression[] = [url];

    if (init.length) {
        const initObj = ts.createObjectLiteral(init, true);
        fetchArgs.push(bodyMode ? callFunction("http", bodyMode, [initObj]) : initObj);
    }

    return core.addComment(
        core.createFunctionDeclaration(
            name,
            {
                modifiers: [core.modifier.export, core.modifier.async],
                type: ts.createTypeReferenceNode("Promise", [
                    ts.createTypeReferenceNode("ApiResponse", [response])
                ])
            },
            args,
            core.block(
                ts.createReturn(
                    ts.createAwait(
                        callFunction(
                            "http",
                            responseJSON ? "fetchJson" :
                                responseVoid ? "fetchVoid" :
                                    "fetch",
                            fetchArgs
                        )
                    )
                )
            )
        ),
        operation.summary || operation.description
    );
}

function generateQs(parameters: ParameterObject[], paramsVars: Record<string, string>): ts.CallExpression | undefined {
    if (!parameters.length) {
        return;
    }

    const paramsByFormatter = groupByFormatter(parameters);

    return callFunction(
        "QS", "query",
        Object.entries(paramsByFormatter).map(([format, params]) => {
            return callFunction("QS", format, [
                core.createObjectLiteral(
                    params.map((p) => [p.name, paramsVars[p.name]])
                ),
            ]);
        })
    );
}

function generateUrl(path: string, qs?: ts.CallExpression): ts.Expression {
    const spans: Array<{ expression: ts.Expression; literal: string }> = [];
    // Use a replacer function to collect spans as a side effect:
    const head = path.replace(
        /(.*?)\{(.+?)\}(.*?)(?=\{|$)/g,
        (_, head, name, literal) => {
            const expression = camelCase(name);
            spans.push({ expression: ts.createIdentifier(expression), literal });
            return head;
        }
    );

    if (qs) {
        // add the query string as last span
        spans.push({ expression: qs, literal: "" });
    }

    return core.createTemplateString(head, spans);
}

//#endregion

//#region Utils

function callFunction(ns: string, name: string, args: ts.Expression[]): ts.CallExpression {
    return core.createCall(
        ts.createPropertyAccess(ts.createIdentifier(ns), name),
        { args }
    );
}

function groupByFormatter(parameters: ParameterObject[]): Record<Formatter, ParameterObject[]> {
    const res: Record<string, ParameterObject[]> = {};

    parameters.forEach(param => {
        const formatter = getFormatter(param);
        res[formatter] = res[formatter] || [];
        res[formatter].push(param);
    });

    return res;
}

function getFormatter({ style, explode }: ParameterObject): Formatter {
    if (style === "spaceDelimited") return "space";
    if (style === "pipeDelimited") return "pipe";
    if (style === "deepObject") return "deep";

    if (style === "form") {
        return explode === false ? "form" : "explode";
    }

    return explode ? "explode" : "form";
}

//#endregion

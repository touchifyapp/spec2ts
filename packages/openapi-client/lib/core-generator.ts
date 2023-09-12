import * as ts from "typescript";
import * as core from "@spec2ts/core";

import type {
    OpenAPIObject,
    ParameterObject,
    PathItemObject,
    OperationObject
} from "openapi3-ts/oas30";

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

export function generateServers(file: ts.SourceFile, { servers }: OpenAPIObject, context: OApiGeneratorContext): ts.SourceFile {
    servers = servers || [];

    if (context.options.baseUrl) servers = [{ url: context.options.baseUrl }];

    const serversConst = core.findFirstVariableStatement(file.statements, "servers");
    const defaultsConst = core.findFirstVariableStatement(file.statements, "defaults");

    if (!serversConst || !defaultsConst) {
        throw new Error("Invalid template: missing servers or defaults const");
    }

    file = core.replaceSourceFileStatement(
        file,
        serversConst,
        core.updateVariableStatementValue(serversConst, "servers", parseServers(servers))
    );

    file = core.replaceSourceFileStatement(
        file,
        defaultsConst,
        core.updateVariableStatementPropertyValue(
            defaultsConst,
            "defaults",
            "baseUrl",
            defaultBaseUrl(servers)
        )
    );

    return file;
}

export function generateDefaults(file: ts.SourceFile, context: OApiGeneratorContext): ts.SourceFile {
    if (context.options.importFetch) {
        const defaultsConst = core.findFirstVariableStatement(file.statements, "defaults");
        if (!defaultsConst) {
            throw new Error("Invalid template: missing defaults const");
        }

        file = core.prependSourceFileStatements(
            file,

            core.createDefaultImportDeclaration({
                moduleSpecifier: context.options.importFetch,
                name: "fetch",
                bindings: ["RequestInit", "Headers"]
            }),

            core.createNamespaceImportDeclaration({
                moduleSpecifier: "form-data",
                name: "FormData"
            })
        );

        file = core.replaceSourceFileStatement(
            file,
            defaultsConst,
            core.updateVariableStatementPropertyValue(
                defaultsConst,
                "defaults",
                "fetch",
                core.toExpression("fetch")
            )
        );
    }

    return file;
}

export function generateFunctions(file: ts.SourceFile, spec: OpenAPIObject, context: OApiGeneratorContext): ts.SourceFile {
    const paths: typeof spec.paths = Object.fromEntries(Object.entries(spec.paths)
        .filter(([path]) => !context.options.prefix || path.startsWith(context.options.prefix)));

    const functions: ts.FunctionDeclaration[] = Object.entries(paths).map(([path, pathSpec]) => {
        const item = resolveReference<PathItemObject>(pathSpec, context);

        return Object.entries(item)
            .filter(([verb,]) => isMethod(verb.toUpperCase()))
            .map(([verb, entry]) => generateFunction(path, item, (verb.toUpperCase() as Method), entry, context));
    }).flat();

    if (context.options.typesPath && context.typesFile) {
        context.typesFile = core.updateSourceFileStatements(context.typesFile, context.aliases);

        file = core.updateSourceFileStatements(file, [
            core.createNamedImportDeclaration({
                moduleSpecifier: context.options.typesPath,
                bindings: context.aliases.map(a => a.name.text)
            }),
            ...file.statements,
            ...functions
        ]);
    }
    else {
        file = core.appendSourceFileStatements(
            file,
            ...context.aliases,
            ...functions
        );
    }

    return file;
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
        ts.factory.createSpreadAssignment(ts.factory.createIdentifier("options")),
    ];

    if (method !== "GET") {
        init.push(
            ts.factory.createPropertyAssignment("method", ts.factory.createStringLiteral(method))
        );
    }

    if (bodyVar) {
        init.push(
            core.createPropertyAssignment("body", ts.factory.createIdentifier(bodyVar))
        );
    }

    if (header.length) {
        init.push(
            ts.factory.createPropertyAssignment(
                "headers",
                ts.factory.createObjectLiteralExpression(
                    [
                        ts.factory.createSpreadAssignment(
                            ts.factory.createPropertyAccessChain(
                                ts.factory.createIdentifier("options"),
                                core.questionDotToken,
                                ts.factory.createIdentifier("headers")
                            )
                        ),
                        ...header.map(({ name }) =>
                            core.createPropertyAssignment(
                                name,
                                ts.factory.createIdentifier(paramsVars[name])
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
        const initObj = ts.factory.createObjectLiteralExpression(init, true);
        fetchArgs.push(bodyMode ? callFunction("http", bodyMode, [initObj]) : initObj);
    }

    return core.addComment(
        core.createFunctionDeclaration(
            name,
            {
                modifiers: [core.modifier.export, core.modifier.async],
                type: ts.factory.createTypeReferenceNode("Promise", [
                    ts.factory.createTypeReferenceNode("ApiResponse", [response])
                ])
            },
            args,
            core.block(
                ts.factory.createReturnStatement(
                    ts.factory.createAwaitExpression(
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
            spans.push({ expression: ts.factory.createIdentifier(expression), literal });
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
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(ns), name),
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

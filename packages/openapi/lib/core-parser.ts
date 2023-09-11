import * as ts from "typescript";
import * as core from "@spec2ts/core";

import type {
    SchemaObject,
    ReferenceObject,
    PathItemObject,
    OperationObject,
    ParameterObject,
    ContentObject,
    ResponseObject
} from "openapi3-ts/oas30";

import {
    JSONSchema,
    ParserContext,
    ParsedReference,

    getTypeFromSchema,
    getTypeFromProperties,

    createRefContext,
    resolveReference,
    pascalCase
} from "@spec2ts/jsonschema/lib/core-parser";

import type { ParseOpenApiOptions } from "./openapi-parser";

export interface ParseOpenApiResult {
    import: ts.Statement[];
    params: ts.Statement[];
    query: ts.Statement[];
    headers: ts.Statement[];
    body: ts.Statement[];
    responses: ts.Statement[];
    models: ts.Statement[];
    cookie: ts.Statement[];
    all: ts.Statement[];
}

const VERBS = ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"];

export interface OApiParserContext extends ParserContext {
    options: ParseOpenApiOptions;
}

export function parsePathItem(path: string, item: PathItemObject, context: OApiParserContext, result: ParseOpenApiResult): void {
    let baseParams: ParsedParams | undefined;
    if (item.parameters) {
        baseParams = parseParameters(
            getPathName(path, context),
            item.parameters,
            undefined,
            context,
            result
        );
    }

    Object.entries(item)
        .filter(([verb,]) => VERBS.includes(verb.toUpperCase()))
        .forEach(([verb, entry]) => parseOperation(path, verb, entry, baseParams, context, result));
}

export function parseOperation(path: string, verb: string, operation: OperationObject, baseParams: ParsedParams | undefined, context: OApiParserContext, result: ParseOpenApiResult): void {
    const name = getOperationName(verb, path, operation.operationId, context);
    if (operation.parameters) {
        parseParameters(name, operation.parameters, baseParams, context, result);
    }

    if (operation.requestBody) {
        const requestBody = resolveReference(operation.requestBody, context);
        const decla = getContentDeclaration(name + "Body", requestBody.content, context);
        if (decla) { addToOpenApiResult(result, "body", decla); }
    }

    if (operation.responses) {
        const responses = resolveReference(operation.responses, context);
        Object.keys(responses).forEach(status => {
            const response = resolveReference<ResponseObject>(responses[status], context);

            const decla = getContentDeclaration(getResponseName(name, status, context), response.content, context);
            if (decla) { addToOpenApiResult(result, "responses", decla); }
        });
    }
}

export type ParamType = "params" | "headers" | "query" | "cookie";

export function parseParameters(baseName: string, data: Array<ReferenceObject | ParameterObject>, baseParams: ParsedParams = {}, context: OApiParserContext, result: ParseOpenApiResult): ParsedParams {
    const params: ParameterObject[] = [];
    const query: ParameterObject[] = [];
    const headers: ParameterObject[] = [];
    const cookie: ParameterObject[] = [];

    const res: ParsedParams = {}

    data.forEach(item => {
        item = resolveReference(item, context);

        switch (item.in) {
            case "path":
                params.push(item);
                break;
            case "header":
                headers.push(item);
                break;
            case "query":
                query.push(item);
                break;
            case "cookie":
                cookie.push(item);
                break;
        }
    });


    addParams(params, "params");
    addParams(headers, "headers");
    addParams(query, "query");
    addParams(cookie, "cookie");

    return res;

    function addParams(params: ParameterObject[], paramType: ParamType): void {
        if (!params.length) return;

        const name = baseName + pascalCase(paramType);
        const type = getParamType(paramType, params, baseParams[paramType], context);

        addToOpenApiResult(result, paramType,
            core.createTypeOrInterfaceDeclaration({
                modifiers: [core.modifier.export],
                name,
                type
            })
        );

        res[paramType] = ts.factory.createTypeReferenceNode(name, undefined);
    }
}

export function parseReference(ref: ParsedReference, context: ParserContext): void {
    const type = getTypeFromSchema(ref.schema, createRefContext(ref, context));
    context.aliases.push(
        core.createTypeOrInterfaceDeclaration({
            modifiers: [core.modifier.export],
            name: ref.name,
            type
        })
    );
}

//#endregion

//#region Utils

export function getContentDeclaration(name: string, content: ReferenceObject | ContentObject | undefined, context: OApiParserContext): ts.Statement | undefined {
    if (!content) return;

    content = resolveReference(content, context);

    const schema = getSchemaFromContent(content);
    if (!schema) return;

    const type = getTypeFromSchema(schema as JSONSchema, context);
    return core.createTypeOrInterfaceDeclaration({
        modifiers: [core.modifier.export],
        name,
        type
    });
}

export function getParamType(paramType: ParamType, data: ParameterObject[], baseType: ts.TypeReferenceNode | undefined, context: OApiParserContext): ts.TypeNode {
    const required: string[] = [];

    const props: Record<string, SchemaObject | ReferenceObject> = {};
    data.forEach(m => {
        let name = m.name;
        if (paramType === "headers" && context.options.lowerHeaders) {
            name = name.toLowerCase();
        }

        props[name] = m.schema || {};
        if (m.required) {
            required.push(name);
        }
    });

    const ctx = paramType === "query" && typeof context.options.enableDateForQueryParams !== "undefined"
        ? { ...context, options: { ...context.options, enableDate: context.options.enableDateForQueryParams } }
        : context;

    const type = getTypeFromProperties(props as Record<string, JSONSchema>, required, false, ctx);
    if (baseType) {
        return ts.factory.createIntersectionTypeNode([baseType, type]);
    }

    return type;
}

export function getSchemaFromContent(content: ContentObject): SchemaObject | ReferenceObject | undefined {
    return content?.["application/json"]?.schema ||
        content?.["application/x-www-form-urlencoded"]?.schema ||
        content?.["multipart/form-data"]?.schema ||
        content?.["*/*"]?.schema;
}

export function getResponseName(operationName: string, statusCode: string, context: OApiParserContext): string {
    let name = operationName + "Response";

    const status = parseInt(statusCode);
    if (status >= 200 && status < 300) {
        const count = (context.names[name] = (context.names[name] || 0) + 1);
        if (count > 1) {
            name += statusCode;
        }
    }
    else if (!isNaN(status)) {
        name += statusCode;
    }
    else {
        // default
        name += pascalCase(statusCode);
    }

    return name;
}

export function getOperationName(verb: string, path: string, operationId: string | undefined, context: OApiParserContext): string {
    const id = getOperationIdentifier(operationId);
    if (id) {
        return id;
    }

    return getPathName(`${verb} ${path}`, context);
}

export function getPathName(path: string, context: OApiParserContext): string {
    path = path.replace(/\{(.+?)\}/, "by $1").replace(/\{(.+?)\}/g, "and $1");
    let name = pascalCase(path);

    const count = (context.names[name] = (context.names[name] || 0) + 1);
    if (count > 1) {
        name += count;
    }

    return name;
}

export function getOperationIdentifier(id?: string): string | void {
    if (!id) return;
    if (id.match(/[^\w\s]/)) return;
    id = pascalCase(id);
    if (core.isValidIdentifier(id)) return id;
}

export function addToOpenApiResult(result: ParseOpenApiResult, prop: keyof ParseOpenApiResult, statement: ts.Statement | ts.Statement[]): void {
    const statements = Array.isArray(statement) ? statement : [statement];
    result[prop].push(...statements);
    result.all.push(...statements);
}

export function createOpenApiResult(): ParseOpenApiResult {
    return { params: [], query: [], headers: [], body: [], responses: [], models: [], cookie: [], import: [], all: [] };
}

interface ParsedParams {
    params?: ts.TypeReferenceNode;
    query?: ts.TypeReferenceNode;
    headers?: ts.TypeReferenceNode;
    cookie?: ts.TypeReferenceNode;
}

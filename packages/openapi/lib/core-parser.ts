import * as ts from "typescript";
import * as core from "@spec2ts/core";

import type {
    SchemaObject,
    ReferenceObject,
    PathItemObject,
    OperationObject,
    ParameterObject,
    ContentObject
} from "openapi3-ts";

import {
    JSONSchema,
    ParserContext,

    getTypeFromSchema,
    getTypeFromProperties,

    resolveReference,
    pascalCase
} from "@spec2ts/jsonschema/lib/core-parser";

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

export function parsePathItem(path: string, item: PathItemObject, context: ParserContext, result: ParseOpenApiResult): void {
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

    Object.keys(item).forEach(verb => {
        const method = verb.toUpperCase();
        if (!VERBS.includes(method)) return;

        parseOperation(path, verb, item[verb], baseParams, context, result);
    });
}

export function parseOperation(path: string, verb: string, operation: OperationObject, baseParams: ParsedParams | undefined, context: ParserContext, result: ParseOpenApiResult): void {
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
            const response = responses[status]
            const decla = getContentDeclaration(getResponseName(name, status, context), response.content, context);
            if (decla) { addToOpenApiResult(result, "responses", decla); }
        });
    }
}

export function parseParameters(baseName: string, data: Array<ReferenceObject | ParameterObject>, baseParams: ParsedParams = {}, context: ParserContext, result: ParseOpenApiResult): ParsedParams {
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

    function addParams(params: ParameterObject[], paramType: "params" | "headers" | "query" | "cookie"): void {
        if (!params.length) return;

        const name = baseName + pascalCase(paramType);
        const type = getParamType(params, baseParams[paramType], context);

        addToOpenApiResult(result, paramType,
            core.createTypeOrInterfaceDeclaration({
                modifiers: [core.modifier.export],
                name,
                type
            })
        );

        res[paramType] = ts.createTypeReferenceNode(name, undefined);
    }
}

//#endregion

//#region Utils

export function getContentDeclaration(name: string, content: ReferenceObject | ContentObject, context: ParserContext): ts.Statement | undefined {
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

export function getParamType(data: ParameterObject[], baseType: ts.TypeReferenceNode | undefined, context: ParserContext): ts.TypeNode {
    const required: string[] = [];

    const props: Record<string, SchemaObject | ReferenceObject> = {};
    data.forEach(m => {
        props[m.name] = m.schema || {};
        if (m.required) {
            required.push(m.name);
        }
    });

    const type = getTypeFromProperties(props as Record<string, JSONSchema>, required, false, context);
    if (baseType) {
        return ts.createIntersectionTypeNode([baseType, type]);
    }

    return type;
}

export function getSchemaFromContent(content: ContentObject): SchemaObject | ReferenceObject | undefined {
    return content?.["application/json"]?.schema ||
        content?.["application/x-www-form-urlencoded"]?.schema ||
        content?.["multipart/form-data"]?.schema ||
        content?.["*/*"]?.schema;
}

export function getResponseName(operationName: string, statusCode: string, context: ParserContext): string {
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

export function getOperationName(verb: string, path: string, operationId: string | undefined, context: ParserContext): string {
    const id = getOperationIdentifier(operationId);
    if (id) {
        return id;
    }

    return getPathName(`${verb} ${path}`, context);
}

export function getPathName(path: string, context: ParserContext): string {
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

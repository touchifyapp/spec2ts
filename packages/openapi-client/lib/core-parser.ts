import * as ts from "typescript";
import * as core from "@spec2ts/core";

import type {
    PathItemObject,
    OperationObject,
    ParameterObject,
    RequestBodyObject,
    ReferenceObject,
    ResponseObject,
    ResponsesObject,
    ContentObject
} from "openapi3-ts/oas31";

import {
    ParserContext,
    JSONSchema,
    JSONReference,
    getTypeFromSchema,
    resolveReference,
    isReference
} from "@spec2ts/jsonschema/lib/core-parser";

import {
    getOperationName,
    getResponseName
} from "@spec2ts/openapi/lib/core-parser";

import { camelCase } from "./util";
import type { OApiGeneratorOptions } from "./openapi-generator";

export type Method = "GET" | "PUT" | "POST" | "DELETE" | "OPTIONS" | "HEAD" | "PATCH" | "TRACE";
const methods = ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"];

const contentTypes = {
    "*/*": "json",
    "application/json": "json",
    "application/x-www-form-urlencoded": "form",
    "multipart/form-data": "multipart",
};

export type ContentTypeMode = "json" | "form" | "multipart";

export interface OApiGeneratorContext extends ParserContext {
    options: OApiGeneratorOptions;
    typesFile?: ts.SourceFile;
}

//#region Parse

export interface ParsedOperation {
    name: string;
    paramsVars: Record<string, string>;
    args: ts.ParameterDeclaration[];
    query: ParameterObject[];
    header: ParameterObject[];
    response: ts.TypeNode;
    responseJSON?: boolean;
    responseVoid?: boolean;
    bodyMode?: ContentTypeMode;
    bodyVar?: string;
}

export function parseOperation(path: string, item: PathItemObject, method: Method, operation: OperationObject, context: OApiGeneratorContext): ParsedOperation {
    const result: ParsedOperation = {
        name: getOperationVar(method, path, operation.operationId, context),
        paramsVars: {},
        args: [],
        query: [],
        header: [],
        response: core.keywordType.void
    }

    parseArgs(result, item, operation, context);
    parseResponses(result, path, method, operation, context);

    return result;
}

function parseArgs(result: ParsedOperation, item: PathItemObject, operation: OperationObject, context: OApiGeneratorContext): void {
    parseParameters(result, item, operation, context)

    if (operation.requestBody) {
        parseRequestBody(result, operation.requestBody, context)
    }

    result.args.push(
        core.createParameter("options", {
            type: ts.factory.createTypeReferenceNode("RequestOptions", undefined),
            questionToken: true,
        })
    );
}

function parseResponses(result: ParsedOperation, path: string, method: string, operation: OperationObject, context: OApiGeneratorContext): void {
    const operationName = getOperationName(method, path, operation.operationId, context);
    result.response = getTypeFromResponses(operationName, operation.responses, context);
    result.responseJSON = isJSONResponse(operation.responses, context);
    result.responseVoid = result.response === core.keywordType.void;
}

function parseParameters(result: ParsedOperation, item: PathItemObject, operation: OperationObject, context: OApiGeneratorContext): void {
    const parameters = fixDeepObjects([
        ...resolveReferences<ParameterObject>(item.parameters, context),
        ...resolveReferences<ParameterObject>(operation.parameters, context),
    ]);

    result.query = parameters.filter((p) => p.in === "query");
    result.header = parameters.filter((p) => p.in === "header");

    const argNames = result.paramsVars = createParametersNames(parameters);

    let objectBindingParams = parameters;
    if (context.options.inlineRequired) {
        const [required, optional] = splitParameters(parameters);
        objectBindingParams = optional;

        required.forEach(p => {
            result.args.push(
                core.createParameter(argNames[p.name], {
                    type: getTypeFromSchema(p.schema as JSONSchema, context),
                })
            );
        });
    }

    if (!objectBindingParams.length) {
        return;
    }

    result.args.push(
        core.createParameter(
            core.createObjectBinding(
                objectBindingParams.map(({ name }) => ({ name: argNames[name] }))
            ),
            {
                initializer: objectBindingParams.some(p => p.required) ? undefined : ts.factory.createObjectLiteralExpression(),
                type: ts.factory.createTypeLiteralNode(
                    objectBindingParams.map((p) =>
                        core.createPropertySignature({
                            name: argNames[p.name],
                            questionToken: !p.required,
                            type: getTypeFromSchema(p.schema as JSONSchema, context)
                        })
                    )
                ),
            }
        )
    );
}

function parseRequestBody(result: ParsedOperation, requestBody: RequestBodyObject | ReferenceObject, context: OApiGeneratorContext): void {
    const body = resolveReference<RequestBodyObject>(requestBody, context);
    const [schema, mode] = getSchemaFromContent(body.content);
    const type = getTypeFromSchema(schema as JSONSchema, context);

    const bodyVar = result.bodyVar = camelCase(
        (type as any).name || getReferenceName(schema) || "body"
    );

    result.bodyMode = mode;

    result.args.push(
        core.createParameter(bodyVar, { type })
    );
}

function createParametersNames(parameters: ParameterObject[]): Record<string, string> {
    const argNames: Record<string, string> = {};

    parameters.forEach(({ name }) => {
        // strip leading namespaces, eg. foo.name -> name
        const stripped = camelCase(name.replace(/.+\./, ""));
        // keep the prefix if the stripped-down name is already taken
        argNames[name] = stripped in argNames ? camelCase(name) : stripped;
    });

    return argNames;
}

function splitParameters(parameters: ParameterObject[]): [ParameterObject[], ParameterObject[]] {
    const required: ParameterObject[] = [];
    const optional: ParameterObject[] = [];

    parameters.forEach(p => {
        if (p.required) required.push(p);
        else optional.push(p);
    });

    return [required, optional];
}

function getTypeFromResponses(operationName: string, res: ResponsesObject, context: OApiGeneratorContext): ts.TypeNode {
    const codes = Object.keys(res);
    const types: ts.TypeNode[] = [];

    codes.forEach(code => {
        const isOK = isOKResponse(code, codes.length);
        const type = getTypeFromResponse(res[code], context);

        if (!type)
            console.log(res[code]);
        if (ts.isTypeReferenceNode(type) || core.isKeywordTypeNode(type)) {
            isOK && types.push(type);
        }
        else {
            const name = getResponseName(operationName, code, context);

            context.aliases.push(
                core.createTypeOrInterfaceDeclaration({
                    modifiers: [core.modifier.export],
                    name, type
                })
            );

            if (isOK) {
                types.push(
                    ts.factory.createTypeReferenceNode(name, undefined)
                );
            }
        }
    });

    if (types.length === 1) {
        return types[0];
    }

    return ts.factory.createUnionTypeNode(types);
}

function isJSONResponse(responses: ResponsesObject, context: OApiGeneratorContext): boolean {
    const codes = Object.keys(responses);
    const resCode = codes.find(code => isOKResponse(code, codes.length));

    if (!resCode) {
        return false;
    }

    const response = resolveReference<ResponseObject>(responses[resCode], context);
    return (
        !!response?.content?.["application/json"] ||
        !!response?.content?.["*/*"]
    );
}

function isOKResponse(code: string, codesCount: number): boolean {
    return codesCount === 1 || parseInt(code, 10) < 400
}

//#endregion

//#region Private

export function isMethod(method: string): method is Method {
    return methods.includes(method);
}

//#endregion

//#region Private

function getTypeFromResponse(res: ResponseObject | ReferenceObject, context: OApiGeneratorContext): ts.TypeNode {
    res = resolveReference<ResponseObject>(res, context);

    if (!res?.content) {
        return core.keywordType.void;
    }

    return getTypeFromSchema(getSchemaFromContent(res.content)[0], context);
}

function getSchemaFromContent(content: ContentObject): [JSONSchema, ContentTypeMode | undefined] {
    const res = Object.entries(contentTypes).find(([t]) => t in content);
    let schema: JSONSchema | undefined;
    let mode: ContentTypeMode | undefined;

    if (res) {
        const [contentType, contentMode] = res;
        mode = contentMode as ContentTypeMode;
        schema = content?.[contentType]?.schema as JSONSchema | undefined;
    }

    return [schema || { type: "string" }, mode];
}

function resolveReferences<T>(array: Array<JSONReference | T> | undefined, context: OApiGeneratorContext): T[] {
    return array?.map(ref => resolveReference(ref, context)) ?? [];
}

function getReferenceName(obj: any): string | void {
    if (isReference(obj)) {
        return camelCase(obj.$ref.split("/").slice(-1)[0]);
    }
}

/**
 * Despite its name, OpenApi's `deepObject` serialization does not support
 * deeply nested objects. As a workaround we detect parameters that contain
 * square brackets and merge them into a single object.
 */
function fixDeepObjects(params: ParameterObject[]): ParameterObject[] {
    const res: ParameterObject[] = [];
    const merged: Record<string, any> = {};

    params.forEach((p) => {
        const m = /^(.+?)\[(.*?)\]/.exec(p.name);
        if (!m) {
            res.push(p);
            return;
        }

        const [, name, prop] = m;
        let obj = merged[name];

        if (!obj) {
            obj = merged[name] = {
                name,
                in: p.in,
                style: "deepObject",
                schema: {
                    type: "object",
                    properties: {},
                },
            };

            res.push(obj);
        }

        obj.schema.properties[prop] = p.schema;
    });

    return res;
}

function getOperationVar(verb: string, path: string, operationId: string | undefined, context: OApiGeneratorContext): string {
    const id = getOperationVarId(operationId);
    if (id) {
        return id;
    }

    return getPathVar(`${verb} ${path}`, context);
}

function getPathVar(path: string, context: OApiGeneratorContext): string {
    path = path.replace(/\{(.+?)\}/, "by $1").replace(/\{(.+?)\}/g, "and $1");
    let name = camelCase(path);

    const count = (context.names[name] = (context.names[name] || 0) + 1);
    if (count > 1) {
        name += count;
    }

    return name;
}

function getOperationVarId(id?: string): string | void {
    if (!id) return;
    if (id.match(/[^\w\s]/)) return;
    id = camelCase(id);
    if (core.isValidIdentifier(id)) return id;
}

//#endregion

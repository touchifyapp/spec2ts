import * as path from "path";
import * as $RefParser from "@apidevtools/json-schema-ref-parser";

import type {
    OpenAPIObject
} from "openapi3-ts";

import {
    ParserOptions,

    createImportDeclarations,
    createContext
} from "@spec2ts/jsonschema/lib/core-parser";

import {
    ParseOpenApiResult,

    parsePathItem,
    createOpenApiResult,
    addToOpenApiResult
} from "./core-parser";

export {
    ParseOpenApiResult
};

export type ParseOpenApiOptions = ParserOptions;

export async function parseOpenApiFile(file: string, options: ParseOpenApiOptions = {}): Promise<ParseOpenApiResult> {
    const schema = await $RefParser.parse(file) as OpenAPIObject;

    return parseOpenApi(schema, {
        cwd: path.resolve(path.dirname(file)) + "/",
        ...options
    });
}

export async function parseOpenApi(spec: OpenAPIObject, options: ParseOpenApiOptions = {}): Promise<ParseOpenApiResult> {
    const context = await createContext(spec, options);
    const result: ParseOpenApiResult = createOpenApiResult();

    Object.keys(spec.paths).forEach(path => {
        parsePathItem(path, spec.paths[path], context, result);
    });

    const imports = createImportDeclarations(context.refs);

    addToOpenApiResult(result, "import", imports);
    addToOpenApiResult(result, "models", context.aliases);

    return result;
}

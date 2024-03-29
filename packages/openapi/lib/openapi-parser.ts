import * as path from "path";
import $RefParser from "@apidevtools/json-schema-ref-parser";

import type {
    OpenAPIObject,
} from "openapi3-ts/oas31";

import {
    ParserOptions,
    createContext
} from "@spec2ts/jsonschema/lib/core-parser";

import {
    ParseOpenApiResult,

    parsePathItem,
    parseReference,
    createOpenApiResult,
    addToOpenApiResult
} from "./core-parser";

export {
    ParseOpenApiResult
};

export interface ParseOpenApiOptions extends ParserOptions {
    lowerHeaders?: boolean;
    enableDateForQueryParams?: boolean | "strict" | "lax";
}

export async function parseOpenApiFile(file: string, options: ParseOpenApiOptions = {}): Promise<ParseOpenApiResult> {
    const schema = await $RefParser.parse(file) as OpenAPIObject;

    return parseOpenApi(schema, {
        cwd: path.resolve(path.dirname(file)) + "/",
        ...options
    });
}

export async function parseOpenApi(spec: OpenAPIObject, options: ParseOpenApiOptions = {}): Promise<ParseOpenApiResult> {
    if (!options.parseReference) {
        options.parseReference = parseReference;
    }

    const context = await createContext(spec, options);
    const result: ParseOpenApiResult = createOpenApiResult();

    Object.entries(spec.paths ?? {}).forEach(([path, item]) => {
        parsePathItem(path, item, context, result);
    });

    addToOpenApiResult(result, "models", context.aliases);

    return result;
}

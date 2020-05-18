import * as path from "path";
import * as ts from "typescript";
import * as core from "@spec2ts/core";
import * as $RefParser from "@apidevtools/json-schema-ref-parser";

import type {
    OpenAPIObject
} from "openapi3-ts";

import {
    ParserOptions,
    createContext
} from "@spec2ts/jsonschema/lib/core-parser";

import {
    parseReference
} from "@spec2ts/openapi/lib/core-parser";

import {
    generateServers,
    generateDefaults,
    generateFunctions
} from "./core-generator";

export interface OApiGeneratorOptions extends ParserOptions {
    inlineRequired?: boolean;
    importFetch?: "node-fetch" | "cross-fetch" | "isomorphic-fetch";
}

export async function generateClientFromFile(file: string, options: OApiGeneratorOptions = {}): Promise<ts.SourceFile> {
    const schema = await $RefParser.parse(file) as OpenAPIObject;

    return generateClient(schema, {
        cwd: path.resolve(path.dirname(file)) + "/",
        ...options
    });
}

export async function generateClient(spec: OpenAPIObject, options: OApiGeneratorOptions = {}): Promise<ts.SourceFile> {
    if (!options.parseReference) {
        options.parseReference = parseReference;
    }

    const context = await createContext(spec, options);
    const file = await core.createSourceFileFromFile(__dirname + "/templates/_client.tpl.ts");

    generateServers(file, spec);
    generateDefaults(file, context);
    generateFunctions(file, spec, context);

    return file;
}

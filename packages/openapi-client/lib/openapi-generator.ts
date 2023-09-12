import * as path from "path";
import * as ts from "typescript";
import * as core from "@spec2ts/core";
import $RefParser from "@apidevtools/json-schema-ref-parser";

import type {
    OpenAPIObject
} from "openapi3-ts/oas30";

import {
    ParserOptions,
    createContext
} from "@spec2ts/jsonschema/lib/core-parser";

import {
    parseReference
} from "@spec2ts/openapi/lib/core-parser";

import {
    OApiGeneratorContext
} from "./core-parser";

import {
    generateServers,
    generateDefaults,
    generateFunctions
} from "./core-generator";

export interface OApiGeneratorOptions extends ParserOptions {
    inlineRequired?: boolean;
    importFetch?: "node-fetch" | "cross-fetch" | "isomorphic-fetch";
    typesPath?: string;
    baseUrl?: string;
    prefix?: string;
}

export async function generateClientFromFile(file: string, options: OApiGeneratorOptions & { typesPath: string }): Promise<SeparatedClientResult>;
export async function generateClientFromFile(file: string, options?: OApiGeneratorOptions): Promise<ts.SourceFile>;
export async function generateClientFromFile(file: string, options: OApiGeneratorOptions = {}): Promise<ts.SourceFile | SeparatedClientResult> {
    const schema = await $RefParser.parse(file) as OpenAPIObject;

    return generateClient(schema, {
        cwd: path.resolve(path.dirname(file)) + "/",
        ...options
    });
}

export async function generateClient(spec: OpenAPIObject, options: OApiGeneratorOptions & { typesPath: string }): Promise<SeparatedClientResult>;
export async function generateClient(spec: OpenAPIObject, options?: OApiGeneratorOptions): Promise<ts.SourceFile>;
export async function generateClient(spec: OpenAPIObject, options: OApiGeneratorOptions = {}): Promise<ts.SourceFile | SeparatedClientResult> {
    if (!options.parseReference) {
        options.parseReference = parseReference;
    }

    const context = await createContext(spec, options) as OApiGeneratorContext;
    let file = await core.createSourceFileFromFile(__dirname + "/templates/_client.tpl.ts");

    if (context.options.typesPath) {
        context.typesFile = ts.createSourceFile("types.ts", "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    }

    file = generateServers(file, spec, context);
    file = generateDefaults(file, context);
    file = generateFunctions(file, spec, context);

    if (context.options.typesPath) {
        return {
            client: file,
            types: context.typesFile as ts.SourceFile
        };
    }

    return file;
}

export interface SeparatedClientResult {
    client: ts.SourceFile;
    types: ts.SourceFile;
}

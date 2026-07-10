import type { OpenAPIObject } from "openapi3-ts/oas31";
import type * as ts from "typescript/unstable/ast";

import $RefParser from "@apidevtools/json-schema-ref-parser";
import * as core from "@spec2ts/core";
import { type ParserOptions, createContext } from "@spec2ts/jsonschema";
import { parseReference } from "@spec2ts/openapi";
import path from "node:path";
import { SyntaxKind } from "typescript/unstable/ast";
import * as factory from "typescript/unstable/ast/factory";

import { generateServers, generateDefaults, generateFunctions } from "./core-generator";
import { OApiGeneratorContext } from "./core-parser";

export interface OApiGeneratorOptions extends ParserOptions {
    inlineRequired?: boolean;
    importFetch?: "node-fetch" | "cross-fetch" | "isomorphic-fetch";
    typesPath?: string;
    baseUrl?: string;
    prefix?: string;
}

export async function generateClientFromFile(
    file: string,
    options: OApiGeneratorOptions & { typesPath: string },
): Promise<SeparatedClientResult>;
export async function generateClientFromFile(file: string, options?: OApiGeneratorOptions): Promise<ts.SourceFile>;
export async function generateClientFromFile(
    file: string,
    options: OApiGeneratorOptions = {},
): Promise<ts.SourceFile | SeparatedClientResult> {
    const schema = (await $RefParser.parse(file)) as OpenAPIObject;

    return generateClient(schema, {
        cwd: path.resolve(path.dirname(file)) + "/",
        ...options,
    });
}

export async function generateClient(
    spec: OpenAPIObject,
    options: OApiGeneratorOptions & { typesPath: string },
): Promise<SeparatedClientResult>;
export async function generateClient(spec: OpenAPIObject, options?: OApiGeneratorOptions): Promise<ts.SourceFile>;
export async function generateClient(
    spec: OpenAPIObject,
    options: OApiGeneratorOptions = {},
): Promise<ts.SourceFile | SeparatedClientResult> {
    if (!options.parseReference) {
        options.parseReference = parseReference;
    }

    const context = (await createContext(spec, options)) as OApiGeneratorContext;
    let file = await core.createSourceFileFromFile(import.meta.dirname + "/templates/_client.tpl.ts");

    if (context.options.typesPath) {
        context.typesFile = factory.createSourceFile([], factory.createToken(SyntaxKind.EndOfFile), "", "types.ts", "types.ts" as ts.Path);
    }

    file = generateServers(file, spec, context);
    file = generateDefaults(file, context);
    file = generateFunctions(file, spec, context);

    if (context.options.typesPath) {
        return {
            client: file,
            types: context.typesFile as ts.SourceFile,
        };
    }

    return file;
}

export interface SeparatedClientResult {
    client: ts.SourceFile;
    types: ts.SourceFile;
}

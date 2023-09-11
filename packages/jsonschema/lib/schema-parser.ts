import * as path from "path";
import * as ts from "typescript";

import { parse } from "@apidevtools/json-schema-ref-parser";

import * as core from "@spec2ts/core";

import {
    JSONSchema,
    ParserOptions,

    getTypeFromSchema,
    parseDefinitions,

    getSchemaName,
    createContext,
} from "./core-parser";

export interface ParseSchemaOptions extends ParserOptions {
    name?: string;
}

export async function parseSchemaFile(file: string, options: ParseSchemaOptions = {}): Promise<ts.Statement[]> {
    const schema = await parse(file);

    return parseSchema(schema, {
        name: getSchemaName(schema, file),
        cwd: path.resolve(path.dirname(file)) + "/",
        ...options
    });
}

export async function parseSchema(schema: JSONSchema, options: ParseSchemaOptions = {}): Promise<ts.Statement[]> {
    const context = await createContext(schema, options);
    const type = getTypeFromSchema(context.schema, context);

    parseDefinitions(context.schema, context);

    const res: ts.Statement[] = [];

    res.push(
        ...context.imports,
        ...context.aliases
    );

    // Ignore schema type if schema is only composed of definitions
    if ((type === core.keywordType.any || type === core.keywordType.unknown) && !context.schema.type && context.schema.definitions) {
        return res;
    }

    let decla = core.createTypeOrInterfaceDeclaration({
        modifiers: [core.modifier.export],
        name: options.name || getSchemaName(context.schema),
        type
    });

    if (schema.description) {
        decla = core.addComment(decla, schema.description);
    }

    res.push(decla);

    return res;
}

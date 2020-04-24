import * as path from "path";
import * as ts from "typescript";

import * as $RefParser from "@apidevtools/json-schema-ref-parser";

import * as core from "@spec2ts/core";

import {
    ParserOptions,

    getTypeFromSchema,
    createImportDeclarations,

    getSchemaName,
    createContext,
} from "./core-parser";

export interface ParseSchemaOptions extends ParserOptions {
    name?: string;
}

export type JSONSchema = $RefParser.JSONSchema;

export async function parseSchemaFile(file: string): Promise<ts.Statement[]> {
    const schema = await $RefParser.parse(file);

    return parseSchema(schema, {
        name: getSchemaName(schema, file),
        cwd: path.resolve(path.dirname(file)) + "/"
    });
}

export async function parseSchema(schema: JSONSchema, options: ParseSchemaOptions = {}): Promise<ts.Statement[]> {
    const context = await createContext(schema, options);
    const type = getTypeFromSchema(context.schema, context);

    const res: ts.Statement[] = [];

    res.push(
        ...createImportDeclarations(context.refs),
        ...context.aliases
    );

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

import * as path from "path";
import * as ts from "typescript";

import * as $RefParser from "@apidevtools/json-schema-ref-parser";

import type {
    JSONSchema4,
    JSONSchema4TypeName,
    JSONSchema6,
    JSONSchema6TypeName,
    JSONSchema7,
    JSONSchema7TypeName
} from "json-schema";

import * as core from "@spec2ts/core";

//#region Types

export {
    JSONSchema4,
    JSONSchema6,
    JSONSchema7
};

export type JSONSchema = JSONSchema4 | JSONSchema6 | JSONSchema7;
export type JSONSchemaTypeName = JSONSchema4TypeName | JSONSchema6TypeName | JSONSchema7TypeName;
export type JSONSchemaDefinition = JSONSchema | boolean;
export type JSONReference = { $ref: string };

export interface ParserOptions {
    cwd?: string;
    avoidAny?: boolean;
    enableDate?: boolean;
    parseReference?: (ref: ParsedReference, context: ParserContext) => void;
}

export interface ParserContext {
    schema: JSONSchema;
    $refs: $RefParser.$Refs;
    refs: Record<string, ParsedReference>;
    imports: ts.ImportDeclaration[];
    aliases: Array<ts.TypeAliasDeclaration | ts.InterfaceDeclaration>;
    options: ParserOptions;
    names: Record<string, number>;
    refPrefix?: string;
}

export interface ParsedReference {
    $ref: string;
    name: string;
    schema: JSONSchema;
    node: ts.TypeReferenceNode;
    isRemote: boolean;
    isLocal: boolean;
    path?: string;
}

export interface ReferenceDetails<T> {
    path: string;
    schema: T;
}

//#endregion

//#region Core

/**
 * Creates a type node from a given schema.
 * Delegates to getBaseTypeFromSchema internally and optionally adds a union with null.
 */
export function getTypeFromSchema(schema: JSONSchema | JSONReference | undefined, context: ParserContext): ts.TypeNode {
    const type = getBaseTypeFromSchema(schema, context);

    return isNullable(schema) ?
        ts.factory.createUnionTypeNode([type, core.keywordType.null]) :
        type;
}

/** This is the very core of the Schema to TS conversion - it takes a schema and returns the appropriate type. */
export function getBaseTypeFromSchema(schema: JSONSchema | JSONReference | undefined, context: ParserContext): ts.TypeNode {
    if (!schema) {
        return getAnyType(context);
    }

    if (isReference(schema)) {
        return getReferenceType(schema, context);
    }

    if (schema.oneOf) { // oneOf -> union
        return ts.factory.createUnionTypeNode(getTypeFromDefinitions(schema.oneOf, context));
    }

    if (schema.anyOf) { // anyOf -> union
        return ts.factory.createUnionTypeNode(getTypeFromDefinitions(schema.anyOf, context));
    }

    if (schema.allOf) {  // allOf -> intersection
        return ts.factory.createIntersectionTypeNode(getTypeFromDefinitions(schema.allOf, context));
    }

    if (schema.items) { // items -> array
        if (Array.isArray(schema.items)) {
            return ts.factory.createArrayTypeNode(
                ts.factory.createUnionTypeNode(getTypeFromDefinitions(schema.items, context))
            );
        }

        if (typeof schema.items === "boolean") {
            return ts.factory.createArrayTypeNode(getAnyType(context));
        }

        return ts.factory.createArrayTypeNode(getTypeFromSchema(schema.items, context));
    }

    if (schema.properties || schema.additionalProperties) { // properties -> literal type
        return getTypeFromProperties(
            schema.properties || {},
            schema.required || [],
            schema.additionalProperties,
            context
        );
    }

    // (could be boolean -> strong checking required)
    if (typeof schema.const !== "undefined") { // const -> literal type
        return ts.factory.createLiteralTypeNode((s => {
            switch (typeof s) {
                case "string":
                    return ts.factory.createStringLiteral(s);
                case "number":
                    return ts.factory.createNumericLiteral(s.toString());
                case "boolean":
                    return s ? ts.factory.createTrue() : ts.factory.createFalse();
                default:
                    return ts.factory.createStringLiteral(String(s));
            }
        })(schema.const));
    }

    if (schema.enum) { // enum -> union of literal types
        return ts.factory.createUnionTypeNode(
            (schema.enum as Array<string | number | boolean | null>).map(s =>
                ts.factory.createLiteralTypeNode(
                    typeof s === "string" ? ts.factory.createStringLiteral(s) :
                        typeof s === "number" ? ts.factory.createNumericLiteral(s.toString()) :
                            ts.factory.createStringLiteral(String(s))
                )
            )
        );
    }

    if (schema.format == "binary") {
        return ts.factory.createTypeReferenceNode("Blob", []);
    }

    if (context.options.enableDate && (schema.format === "date" || schema.format === "date-time")) {
        return ts.factory.createTypeReferenceNode("Date", []);
    }

    if (schema.type) {
        return getTypeFromStandardTypes(schema.type, context);
    }

    return getAnyType(context);
}

/** Recursively creates a type literal with the given props. */
export function getTypeFromProperties(
    props: Record<string, JSONSchemaDefinition | JSONReference>,
    required: string[] | null | undefined,
    additionalProperties: boolean | JSONSchema | JSONReference | null | undefined,
    context: ParserContext
): ts.TypeNode {
    const members: ts.TypeElement[] = Object.keys(props).map(name => {
        const schema = props[name];
        const isRequired = required && required.includes(name);
        return core.createPropertySignature({
            questionToken: !isRequired,
            name,
            type: getTypeFromDefinition(schema, context)
        });
    });

    if (additionalProperties) {
        const type =
            additionalProperties === true
                ? core.keywordType.any
                : getTypeFromSchema(additionalProperties, context);

        members.push(core.createIndexSignature(type));
    }

    return ts.factory.createTypeLiteralNode(members);
}

/** Creates types from definitions. */
export function parseDefinitions(schema: JSONSchema | JSONReference | undefined, context: ParserContext): void {
    if (!schema || isReference(schema) || !schema.definitions) {
        return;
    }

    return Object.keys(schema.definitions)
        .forEach(refName => parseReference({ $ref: `#/definitions/${refName}` }, context));
}

/** Extract types from a Type Definition array. */
function getTypeFromDefinitions(definitions: JSONSchemaDefinition[], context: ParserContext): ts.TypeNode[] {
    return definitions.map(s => getTypeFromDefinition(s, context));
}

/** Get a type from a schema definition. */
function getTypeFromDefinition(schema: JSONSchemaDefinition, context: ParserContext): ts.TypeNode {
    if (typeof schema === "boolean") {
        return getAnyType(context);
    }

    return getTypeFromSchema(schema, context);
}

/** Get a type from standard types (eg: string, number, boolean...). */
function getTypeFromStandardTypes(type: JSONSchemaTypeName | JSONSchema4TypeName[], context: ParserContext): ts.TypeNode {
    if (!type) {
        return getAnyType(context);
    }

    if (Array.isArray(type)) {
        return ts.factory.createUnionTypeNode(
            type.map(t => getTypeFromStandardTypes(t, context))
        );
    }

    // string, boolean, null, number
    if (core.isKeywordTypeName(type)) return core.keywordType[type];
    if (type === "integer") return core.keywordType.number;

    return getAnyType(context);
}

//#endregion

//#region Reference

export function parseReference(obj: JSONReference, context: ParserContext): ParsedReference {
    const $ref = applyRefPrefix(obj.$ref, context);

    let ref = context.refs[$ref];
    if (!ref) {
        const { schema, path } = resolveReferenceDetails<JSONSchema>({ $ref }, context);

        const name = getSchemaName(schema, $ref);
        ref = context.refs[$ref] = {
            $ref,
            name,
            schema,
            path,
            node: ts.factory.createTypeReferenceNode(name, undefined),
            isRemote: $ref.startsWith("http"),
            isLocal: $ref.startsWith("#/")
        };

        const doParseReference = context.options.parseReference || defaultParseReference;
        doParseReference(ref, context);
    }

    return ref;
}

function defaultParseReference(ref: ParsedReference, context: ParserContext): void {
    if (ref.isRemote || ref.isLocal) {
        const type = getTypeFromSchema(ref.schema, createRefContext(ref, context));
        context.aliases.push(
            core.createTypeOrInterfaceDeclaration({
                modifiers: [core.modifier.export],
                name: ref.name,
                type
            })
        );
    }
    else {
        const importPath = getImportFromRef(ref.$ref);
        if (importPath) {
            addOrUpdateImport(importPath, ref, context);
        }
    }
}

export function getReferenceType(obj: JSONReference, context: ParserContext): ts.TypeReferenceNode {
    const { node } = parseReference(obj, context);
    return node;
}

export function resolveReference<T>(obj: T | JSONReference, context: ParserContext): T {
    if (!isReference(obj)) {
        return obj;
    }

    return context.$refs.get(obj.$ref) as unknown as T;
}

export function resolveReferenceDetails<T>(obj: JSONReference, context: ParserContext): ReferenceDetails<T> {
    const pointer = (context.$refs as any)._resolve(obj.$ref, "");
    const cwd = context.options.cwd || process.cwd();

    return {
        path: path.relative(cwd, pointer.$ref.path),
        schema: pointer.value
    };
}

export function isReference(obj: unknown): obj is JSONReference {
    return typeof obj === "object" && !!obj && "$ref" in obj;
}

//#endregion

//#region Utils

export async function createContext(schema: $RefParser.JSONSchema, options: ParserOptions): Promise<ParserContext> {
    const sanitize = (cwd: string): string =>
        cwd.endsWith("/") ? cwd : cwd + "/";

    const cwd = sanitize(options.cwd || process.cwd());
    const $refs = await $RefParser.resolve(cwd, schema, {});

    return {
        $refs,
        schema,
        refs: {},
        imports: [],
        aliases: [],
        options,
        names: {}
    };
}

export function createRefContext(ref: ParsedReference, context: ParserContext): ParserContext {
    if (!ref.path) return context;

    const refPrefix = !context.refPrefix ? ref.path :
        path.join(path.dirname(context.refPrefix), ref.path);

    return { ...context, refPrefix };
}

export function getSchemaName(schema: JSONSchema, path?: string): string {
    if (schema.title) {
        return pascalCase(schema.title);
    }

    if (schema.$id) {
        return pascalCase(
            schema.$id.replace(/.+\//, "")
                .replace(/\.(json)|(ya?ml)$/, "")
        );
    }

    if (!path) {
        throw new Error("Can't determine Schema name");
    }

    return pascalCase(
        path.replace(/.+\//, "")
            .replace(/\.(json)|(ya?ml)$/, "")
            .replace(/#$/, "")
    );
}

export function getAnyType(context: ParserContext): ts.TypeNode {
    return context.options.avoidAny ?
        core.keywordType.unknown :
        core.keywordType.any;
}

export function isNullable(schema?: JSONSchema & { nullable?: boolean }): boolean {
    return !!(schema && schema.nullable);
}

export function pascalCase(name: string): string {
    return name.match(/[a-z]+/gi)?.map((word) => word.charAt(0).toUpperCase() + word.substr(1)).join("") ?? "";
}

function addOrUpdateImport(importPath: string, ref: ParsedReference, context: ParserContext): void {
    const importNamedBinding = getSchemaName(ref.schema, ref.$ref);
    const importDeclaration = context.imports.find(i => core.getString(i.moduleSpecifier) === importPath);

    if (importDeclaration && importDeclaration.importClause?.namedBindings && ts.isNamedImports(importDeclaration.importClause.namedBindings)) {
        const elements = importDeclaration.importClause.namedBindings.elements;
        const hasName = elements.some(e => e.name.text === importNamedBinding);
        if (hasName) return;

        const newImportDeclaration = ts.factory.updateImportDeclaration(
            importDeclaration,
            importDeclaration.decorators,
            importDeclaration.modifiers,
            ts.factory.updateImportClause(
                importDeclaration.importClause,
                importDeclaration.importClause.isTypeOnly,
                importDeclaration.importClause.name,
                ts.factory.updateNamedImports(importDeclaration.importClause.namedBindings, ts.factory.createNodeArray([
                    ...elements,
                    ts.factory.createImportSpecifier(undefined, core.toIdentifier(importNamedBinding))
                ]))
            ),
            importDeclaration.moduleSpecifier
        );

        context.imports.splice(context.imports.indexOf(importDeclaration), 1, newImportDeclaration);
    }
    else {
        context.imports.push(
            core.createNamedImportDeclaration({
                moduleSpecifier: importPath,
                bindings: [importNamedBinding]
            })
        );
    }
}

function getImportFromRef(ref: string): string | undefined {
    let [importPath] = ref.split("#");
    if (!importPath) return;

    importPath = importPath.replace(/(\.json)|(\.ya?ml)$/, "");

    if (!importPath.startsWith("./")) {
        importPath = "./" + importPath;
    }

    return importPath;
}

function applyRefPrefix(ref: string, context: ParserContext): string {
    if (!context.refPrefix) return ref;
    if (ref.startsWith("http")) return ref;

    if (ref.startsWith("#")) return context.refPrefix + ref;

    return path.join(path.dirname(context.refPrefix), ref);
}

//#endregion

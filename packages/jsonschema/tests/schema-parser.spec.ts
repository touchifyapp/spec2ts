import * as ts from "typescript";
import * as cg from "@spec2ts/core";

import { parseSchema, parseSchemaFile } from "../lib/schema-parser";
import { loadSchema, getAssetsPath } from "./helpers";

describe("schema-parser", () => {

    describe(".parseSchema()", () => {

        test("should resolve with an array of ts.Statement", async () => {
            const schema = loadSchema("person.schema.json");
            const res = await parseSchema(schema);

            expect(res).toBeInstanceOf(Array);
        });

        test("should export an interface if type is object", async () => {
            const schema = loadSchema("person.schema.json");
            const res = await parseSchema(schema);

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toBeDefined();
        });

        test("should get name from title property if defined", async () => {
            const schema = loadSchema("person.schema.json");
            const res = await parseSchema(schema);

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty("name.text", schema.title);
        });

        test("should get name from id property if defined", async () => {
            const schema = loadSchema("arrays.schema.json");
            const res = await parseSchema(schema);

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration, n => n.name.text === "ArraysSchema");

            expect(decla).toHaveProperty("name.text", "ArraysSchema");
        });

        test("should rejects if name could not be defined and no name is passed", async () => {
            const schema = loadSchema("noname.schema.json");

            await expect(parseSchema(schema))
                .rejects.toBeInstanceOf(Error);
        });

        test("should export a type alias declaration if type is not a simple object", async () => {
            const schema = loadSchema("persons.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.TypeAliasDeclaration>(arr, ts.SyntaxKind.TypeAliasDeclaration);

            expect(decla).toBeDefined();
        });

        test("should import type from external references", async () => {
            const schema = loadSchema("persons.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.ImportDeclaration>(arr, ts.SyntaxKind.ImportDeclaration);

            expect(decla).toBeDefined();
            expect(decla).toHaveProperty(["importClause", "namedBindings", "elements", 0, "name", "text"], "Person");
            expect(decla).toHaveProperty("moduleSpecifier.text", "./person.schema");
        });

        test("should include types from definitions", async () => {
            const schema = loadSchema("addresses.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const declas = cg.filterNodes<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(declas).toHaveLength(2);
            expect(declas[0]).toHaveProperty("name.text", "Address");
            expect(declas[1]).toHaveProperty("name.text", "Addresses");
        });

        test("should include types from definitions if only definitions in file", async () => {
            const schema = loadSchema("definitions.schema.json");
            const res = await parseSchema(schema, { name: "DefinitionsSchema", cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const interfaces = cg.filterNodes<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(interfaces).toHaveLength(1);
            expect(interfaces[0]).toHaveProperty("name.text", "Obj");

            const types = cg.filterNodes<ts.TypeAliasDeclaration>(arr, ts.SyntaxKind.TypeAliasDeclaration);

            expect(types).toHaveLength(2);
            expect(types[0]).toHaveProperty("name.text", "Int");
            expect(types[1]).toHaveProperty("name.text", "Str");
        });

        test("should not need name if only definitions in file", async () => {
            const schema = loadSchema("definitions.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            expect(arr).toHaveLength(3);
        });

        test("should append ./ to moduleSpecifier for relative references", async () => {
            const schema = loadSchema("importdefs.schema.json");
            const res = await parseSchema(schema, { name: "ImportDefs", cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const imports = cg.filterNodes<ts.ImportDeclaration>(arr, ts.SyntaxKind.ImportDeclaration);

            expect(imports[0]).toHaveProperty("moduleSpecifier.text", "./definitions.schema");
        });

        test("should merge multiple imports to same module", async () => {
            const schema = loadSchema("importdefs.schema.json");
            const res = await parseSchema(schema, { name: "ImportDefs", cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const imports = cg.filterNodes<ts.ImportDeclaration>(arr, ts.SyntaxKind.ImportDeclaration);

            expect(imports).toHaveLength(1);
            expect(imports[0]).toHaveProperty(["importClause", "namedBindings", "elements", 0, "name", "text"], "Int");
            expect(imports[0]).toHaveProperty(["importClause", "namedBindings", "elements", 1, "name", "text"], "Str");
            expect(imports[0]).toHaveProperty(["importClause", "namedBindings", "elements", 2, "name", "text"], "Obj");
        });

        test("should extend from references if it's an interface and allOf is used", async () => {
            const schema = loadSchema("extends.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toBeDefined();
            expect(decla).toHaveProperty(["heritageClauses", 0, "types", 0, "expression", "escapedText"], "Address");
            expect(decla).toHaveProperty(["heritageClauses", 0, "types", 1, "expression", "escapedText"], "Person");

            expect(decla?.members).toHaveLength(2);
        });

        test("should create an union if oneOf is used", async () => {
            const schema = loadSchema("union.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.TypeAliasDeclaration>(arr, ts.SyntaxKind.TypeAliasDeclaration);

            expect(decla).toBeDefined();
            expect(decla).toHaveProperty("type.kind", ts.SyntaxKind.UnionType);
            expect(decla).toHaveProperty("type.types.length", 4);
        });

        test("should use Date instead of string in enableDate option is provided", async () => {
            const schema = loadSchema("formats.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath(), enableDate: true });

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty(["members", 0, "type", "typeName", "escapedText"], "Date");
        });

        test("should use Date instead of string in enableDate option is set to 'strict'", async () => {
            const schema = loadSchema("formats.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath(), enableDate: "strict" });

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty(["members", 0, "type", "typeName", "escapedText"], "Date");
        });

        test("should use string | Date instead of string in enableDate option is set to 'lax'", async () => {
            const schema = loadSchema("formats.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath(), enableDate: "lax" });

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty(["members", 0, "type", "kind"], ts.SyntaxKind.UnionType);
            expect(decla).toHaveProperty(["members", 0, "type", "types", "length"], 2);

            expect(decla).toHaveProperty(["members", 0, "type", "types", 0], cg.keywordType.string);
            expect(decla).toHaveProperty(["members", 0, "type", "types", 1, "typeName", "escapedText"], "Date");
        });

        test("should parse const as literal type", async () => {
            const schema = loadSchema("const.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.factory.createNodeArray(res);
            const types = cg.filterNodes<ts.TypeAliasDeclaration>(arr, ts.SyntaxKind.TypeAliasDeclaration);

            expect(types).toHaveLength(3);

            expect(types[0]).toHaveProperty("name.text", "Str");
            expect(types[0]).toHaveProperty("type.kind", ts.SyntaxKind.LiteralType);
            expect(types[0]).toHaveProperty("type.literal.kind", ts.SyntaxKind.StringLiteral);
            expect(types[0]).toHaveProperty("type.literal.text", "value");

            expect(types[1]).toHaveProperty("name.text", "Num");
            expect(types[1]).toHaveProperty("type.kind", ts.SyntaxKind.LiteralType);
            expect(types[1]).toHaveProperty("type.literal.kind", ts.SyntaxKind.NumericLiteral);
            expect(types[1]).toHaveProperty("type.literal.text", "0");

            expect(types[2]).toHaveProperty("name.text", "Bool");
            expect(types[2]).toHaveProperty("type.kind", ts.SyntaxKind.LiteralType);
            expect(types[2]).toHaveProperty("type.literal.kind", ts.SyntaxKind.FalseKeyword);
            expect(types[2]).not.toHaveProperty("type.literal.text");
        });

        test("should resolve nested references from their own context", async () => {
            const schema = loadSchema("nested.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.createNodeArray(res);
            const importDecla = cg.findNode<ts.ImportDeclaration>(arr, ts.SyntaxKind.ImportDeclaration);

            expect(importDecla).toBeDefined();
            expect(importDecla).toHaveProperty(["importClause", "namedBindings", "elements", 0, "name", "text"], "Addresses");
            expect(importDecla).toHaveProperty("moduleSpecifier.text", "./addresses.schema");

            const typeDecla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(typeDecla).toHaveProperty(["members", 0, "type", "typeName", "escapedText"], "Addresses");

        });

    });

    describe(".parseSchemaFile()", () => {

        test("should accept json schema", async () => {
            const res = await parseSchemaFile(getAssetsPath("person.schema.json"));

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty("name.text", "Person");
        });

        test("should accept yaml schema", async () => {
            const res = await parseSchemaFile(getAssetsPath("person.schema.yml"));

            const arr = ts.factory.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty("name.text", "Person");
        });

    });

});

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

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toBeDefined();
        });

        test("should get name from title property if defined", async () => {
            const schema = loadSchema("person.schema.json");
            const res = await parseSchema(schema);

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty("name.text", schema.title);
        });

        test("should get name from id property if defined", async () => {
            const schema = loadSchema("arrays.schema.json");
            const res = await parseSchema(schema);

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration, n => n.name.text === "ArraysSchema");

            expect(decla).toHaveProperty("name.text", "ArraysSchema");
        });

        test("should rejects if name could not be defined and no name is passed", async () => {
            const schema = loadSchema("addresses.schema.json");

            await expect(parseSchema(schema))
                .rejects.toBeInstanceOf(Error);
        });

        test("should export a type alias declaration if type is not a simple object", async () => {
            const schema = loadSchema("persons.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.TypeAliasDeclaration>(arr, ts.SyntaxKind.TypeAliasDeclaration);

            expect(decla).toBeDefined();
        });

        test("should import type from external references", async () => {
            const schema = loadSchema("persons.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.ImportDeclaration>(arr, ts.SyntaxKind.ImportDeclaration);

            expect(decla).toBeDefined();
            expect(decla).toHaveProperty(["importClause", "namedBindings", "elements", 0, "name", "text"], "Person");
            expect(decla).toHaveProperty("moduleSpecifier.text", "./person.schema");
        });

        test("should include types from definitions", async () => {
            const schema = loadSchema("addresses.schema.json");
            const res = await parseSchema(schema, { name: "AddressesSchema", cwd: getAssetsPath() });

            const arr = ts.createNodeArray(res);
            const declas = cg.filterNodes<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(declas).toHaveLength(2);
            expect(declas[0]).toHaveProperty("name.text", "Address");
            expect(declas[1]).toHaveProperty("name.text", "AddressesSchema");
        });

        test("should extend from references if it's an interface and allOf is used", async () => {
            const schema = loadSchema("extends.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toBeDefined();
            expect(decla).toHaveProperty(["heritageClauses", 0, "types", 0, "expression", "escapedText"], "Address");
            expect(decla).toHaveProperty(["heritageClauses", 0, "types", 1, "expression", "escapedText"], "Person");

            expect(decla?.members).toHaveLength(2);
        });

        test("should create an union if oneOf is used", async () => {
            const schema = loadSchema("union.schema.json");
            const res = await parseSchema(schema, { cwd: getAssetsPath() });

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.TypeAliasDeclaration>(arr, ts.SyntaxKind.TypeAliasDeclaration);

            expect(decla).toBeDefined();
            expect(decla).toHaveProperty("type.kind", ts.SyntaxKind.UnionType);
            expect(decla).toHaveProperty("type.types.length", 4);
        });

    });

    describe(".parseSchemaFile()", () => {

        test("should accept json schema", async () => {
            const res = await parseSchemaFile(getAssetsPath("person.schema.json"));

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty("name.text", "Person");
        });

        test("should accept yaml schema", async () => {
            const res = await parseSchemaFile(getAssetsPath("person.schema.yml"));

            const arr = ts.createNodeArray(res);
            const decla = cg.findNode<ts.InterfaceDeclaration>(arr, ts.SyntaxKind.InterfaceDeclaration);

            expect(decla).toHaveProperty("name.text", "Person");
        });

    });

});

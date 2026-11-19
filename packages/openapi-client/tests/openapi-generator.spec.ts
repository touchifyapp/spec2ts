import * as core from "@spec2ts/core";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { describe, test, expect } from "vitest";

import { generateClient } from "../src/lib/openapi-generator";
import { loadSpec } from "./helpers";

describe("openapi-parser", () => {
    describe(".generateClient()", () => {
        test("should resolves with an object with a ts.SourceFile", async () => {
            const schema = loadSpec("petstore.yml");
            const res = await generateClient(schema);

            expect(ts.isSourceFile(res)).toBe(true);
        });

        test("should set servers variable", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const servers = core.findFirstVariableDeclaration(file.statements, "servers");
            expect(servers).toHaveProperty(["initializer", "properties", 0, "name", "text"], "server1");
            expect(servers).toHaveProperty(["initializer", "properties", 0, "initializer", "text"], "http://petstore.swagger.io/v1");
        });

        test("should set default baseUrl variable", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const servers = core.findFirstVariableDeclaration(file.statements, "defaults");
            expect(servers).toHaveProperty(["initializer", "properties", 0, "name", "text"], "baseUrl");
            expect(servers).toHaveProperty(["initializer", "properties", 0, "initializer", "text"], "http://petstore.swagger.io/v1");
        });

        test("should generate export async function", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "listPets",
            );

            expect(func).toHaveProperty(["modifiers", 0], core.modifier.export);
            expect(func).toHaveProperty(["modifiers", 1], core.modifier.async);
        });

        test("should generate query parameters", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "listPets",
            );

            expect(func).toHaveProperty(["parameters", 0, "name", "kind"], ts.SyntaxKind.ObjectBindingPattern);
            expect(func).toHaveProperty(["parameters", 0, "name", "elements", 0, "name", "escapedText"], "limit");

            expect(func).toHaveProperty(["parameters", 0, "type", "kind"], ts.SyntaxKind.TypeLiteral);
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "name", "text"], "limit");
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "questionToken"], core.questionToken);
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "type", "kind"], ts.SyntaxKind.NumberKeyword);
        });

        test("should generate path parameters", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "findPetById",
            );

            expect(func).toHaveProperty(["parameters", 0, "name", "kind"], ts.SyntaxKind.ObjectBindingPattern);
            expect(func).toHaveProperty(["parameters", 0, "name", "elements", 0, "name", "escapedText"], "id");

            expect(func).toHaveProperty(["parameters", 0, "type", "kind"], ts.SyntaxKind.TypeLiteral);
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "name", "text"], "id");
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "questionToken"], undefined);
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "type", "kind"], ts.SyntaxKind.NumberKeyword);
        });

        test("should generate merged parameters", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "deletePet",
            );

            expect(func).toHaveProperty(["parameters", 0, "name", "kind"], ts.SyntaxKind.ObjectBindingPattern);
            expect(func).toHaveProperty(["parameters", 0, "name", "elements", 0, "name", "escapedText"], "id");
            expect(func).toHaveProperty(["parameters", 0, "name", "elements", 1, "name", "escapedText"], "force");

            expect(func).toHaveProperty(["parameters", 0, "type", "kind"], ts.SyntaxKind.TypeLiteral);
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "name", "text"], "id");
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "questionToken"], undefined);
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 0, "type", "kind"], ts.SyntaxKind.NumberKeyword);

            expect(func).toHaveProperty(["parameters", 0, "type", "members", 1, "name", "text"], "force");
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 1, "questionToken"], core.questionToken);
            expect(func).toHaveProperty(["parameters", 0, "type", "members", 1, "type", "kind"], ts.SyntaxKind.BooleanKeyword);
        });

        test("should inline required parameters if inlineRequired option is passed", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const file = await generateClient(schema, { inlineRequired: true });

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "deletePet",
            );

            expect(func).toHaveProperty(["parameters", 0, "name", "text"], "id");
            expect(func).toHaveProperty(["parameters", 0, "type", "kind"], ts.SyntaxKind.NumberKeyword);

            expect(func).toHaveProperty(["parameters", 1, "name", "kind"], ts.SyntaxKind.ObjectBindingPattern);
            expect(func).toHaveProperty(["parameters", 1, "name", "elements", 0, "name", "escapedText"], "force");

            expect(func).toHaveProperty(["parameters", 1, "type", "kind"], ts.SyntaxKind.TypeLiteral);
            expect(func).toHaveProperty(["parameters", 1, "type", "members", 0, "name", "text"], "force");
            expect(func).toHaveProperty(["parameters", 1, "type", "members", 0, "questionToken"], core.questionToken);
            expect(func).toHaveProperty(["parameters", 1, "type", "members", 0, "type", "kind"], ts.SyntaxKind.BooleanKeyword);
        });

        test("should include an additionnal RequestOptions parameter", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "deletePet",
            );

            expect(func).toHaveProperty(["parameters", 1, "name", "text"], "options");
            expect(func).toHaveProperty(["parameters", 1, "type", "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["parameters", 1, "type", "typeName", "escapedText"], "RequestOptions");
        });

        test("should generate return type", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "listPets",
            );

            expect(func).toHaveProperty(["type", "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["type", "typeName", "escapedText"], "Promise");
            expect(func).toHaveProperty(["type", "typeArguments", 0, "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["type", "typeArguments", 0, "typeName", "escapedText"], "ApiResponse");
            expect(func).toHaveProperty(["type", "typeArguments", 0, "typeArguments", 0, "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["type", "typeArguments", 0, "typeArguments", 0, "typeName", "escapedText"], "Pets");
        });

        describe("with non-JSON responses", () => {
            const printFunction = async (name: string): Promise<string> => {
                const file = await generateClient(loadSpec("content-types.yml"));
                const func = core.findNode<ts.FunctionDeclaration>(
                    file.statements,
                    ts.SyntaxKind.FunctionDeclaration,
                    (node) => node.name?.text === name,
                );
                return core.printer.printNode(func!);
            };

            test("should read JSON media types as JSON", async () => {
                expect(await printFunction("getJson")).toContain("Promise<ApiResponse<GetJsonResponse>>");
                expect(await printFunction("getJson")).toContain('http.fetchJson("/json", {');
                expect(await printFunction("getProblem")).toContain('http.fetchJson("/problem", {');
            });

            test("should read text media types as string", async () => {
                const csv = await printFunction("getCsv");
                expect(csv).toContain("Promise<ApiResponse<string>>");
                expect(csv).toContain('http.fetchText("/csv", {');
                expect(csv).toContain('}, "text/csv");');

                const xml = await printFunction("getXml");
                expect(xml).toContain("Promise<ApiResponse<string>>");
                expect(xml).toContain('http.fetchText("/xml", {');
                expect(xml).toContain('}, "application/xml");');
            });

            test("should read other media types as Blob", async () => {
                const excel = await printFunction("getExcel");
                expect(excel).toContain("Promise<ApiResponse<globalThis.Blob>>");
                expect(excel).toContain('http.fetchBlob("/excel", {');
                expect(excel).toContain('}, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");');

                const binary = await printFunction("getBinary");
                expect(binary).toContain("Promise<ApiResponse<globalThis.Blob>>");
                expect(binary).toContain('http.fetchBlob("/binary", {');
                expect(binary).toContain('}, "application/octet-stream");');
            });

            test("should not let a `Blob` schema shadow the DOM Blob type", async () => {
                const file = await generateClient(loadSpec("content-types.yml"));
                const source = core.printer.printFile(file);
                expect(source).toContain("export interface Blob {");

                const dir = mkdtempSync(path.join(tmpdir(), "spec2ts-"));
                const filePath = path.join(dir, "client.ts");
                writeFileSync(filePath, source);

                const program = ts.createProgram([filePath], {
                    noEmit: true,
                    strict: true,
                    target: ts.ScriptTarget.ES2022,
                    module: ts.ModuleKind.ESNext,
                    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
                    types: [],
                });
                const diagnostics = ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
                expect(diagnostics).toEqual([]);
            });

            test("should prefer JSON when several media types are available", async () => {
                const negotiated = await printFunction("getNegotiated");
                expect(negotiated).toContain("Promise<ApiResponse<GetNegotiatedResponse>>");
                expect(negotiated).toContain('http.fetchJson("/negotiated", {');
            });

            test("should read response bodies at runtime without corrupting binary data", async () => {
                const file = await generateClient(loadSpec("content-types.yml"));
                const { outputText } = ts.transpileModule(core.printer.printFile(file), {
                    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
                });

                const dir = mkdtempSync(path.join(tmpdir(), "spec2ts-"));
                const modulePath = path.join(dir, "client.mjs");
                writeFileSync(modulePath, outputText);
                const client = await import(pathToFileURL(modulePath).href);

                const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xff, 0xfe, 0x00, 0x80]);
                const accepts: string[] = [];
                const fetch = async (_url: string, init: RequestInit): Promise<Response> => {
                    const accept = (init.headers as Record<string, string>).Accept;
                    accepts.push(accept);
                    return new Response(accept === "text/csv" ? "a;b\n1;2" : bytes, { status: 200 });
                };

                const csv = await client.getCsv({ fetch });
                expect(csv.data).toBe("a;b\n1;2");

                const excel = await client.getExcel({ fetch });
                expect(excel.data).toBeInstanceOf(Blob);
                expect(new Uint8Array(await excel.data.arrayBuffer())).toEqual(bytes);

                expect(accepts).toEqual(["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
            });
        });

        test("should generate a body parameter", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                (node) => node.name?.text === "addPet",
            );

            expect(func).toHaveProperty(["modifiers", 0], core.modifier.export);
            expect(func).toHaveProperty(["modifiers", 1], core.modifier.async);

            expect(func).toHaveProperty(["parameters", 0, "name", "text"], "newPet");
            expect(func).toHaveProperty(["parameters", 0, "type", "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["parameters", 0, "type", "typeName", "escapedText"], "NewPet");
        });

        test("should export Pet entity", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const pet = core.findNode<ts.InterfaceDeclaration>(
                file.statements,
                ts.SyntaxKind.InterfaceDeclaration,
                (node) => node.name.text === "Pet",
            );

            expect(pet).toHaveProperty(["name", "text"], "Pet");

            expect(pet).toHaveProperty(["members", 0, "name", "text"], "id");
            expect(pet).toHaveProperty(["members", 0, "type", "kind"], ts.SyntaxKind.NumberKeyword);

            expect(pet).toHaveProperty(["members", 1, "name", "text"], "name");
            expect(pet).toHaveProperty(["members", 1, "type", "kind"], ts.SyntaxKind.StringKeyword);

            expect(pet).toHaveProperty(["members", 2, "name", "text"], "tag");
            expect(pet).toHaveProperty(["members", 2, "type", "kind"], ts.SyntaxKind.StringKeyword);
        });

        test("should export Pets entity", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const pets = core.findNode<ts.TypeAliasDeclaration>(
                file.statements,
                ts.SyntaxKind.TypeAliasDeclaration,
                (node) => node.name.text === "Pets",
            );

            expect(pets).toHaveProperty(["name", "text"], "Pets");
            expect(pets).toHaveProperty(["type", "kind"], ts.SyntaxKind.ArrayType);
            expect(pets).toHaveProperty(["type", "elementType", "typeName", "escapedText"], "Pet");
        });

        test("should export Error entity", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema);

            const error = core.findNode<ts.InterfaceDeclaration>(
                file.statements,
                ts.SyntaxKind.InterfaceDeclaration,
                (node) => node.name.text === "Error",
            );

            expect(error).toHaveProperty(["name", "text"], "Error");

            expect(error).toHaveProperty(["members", 0, "name", "text"], "code");
            expect(error).toHaveProperty(["members", 0, "type", "kind"], ts.SyntaxKind.NumberKeyword);

            expect(error).toHaveProperty(["members", 1, "name", "text"], "message");
            expect(error).toHaveProperty(["members", 1, "type", "kind"], ts.SyntaxKind.StringKeyword);
        });

        test("should import custom fetch if importFetch option is passed", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema, { importFetch: "node-fetch" });

            const importFetch = file.statements[0] as ts.ImportDeclaration;
            expect(importFetch).toHaveProperty("kind", ts.SyntaxKind.ImportDeclaration);
            expect(importFetch).toHaveProperty("importClause.name.text", "fetch");
            expect(importFetch).toHaveProperty("moduleSpecifier.text", "node-fetch");

            const servers = core.findFirstVariableDeclaration(file.statements, "defaults");
            expect(servers).toHaveProperty(["initializer", "properties", 1, "name", "text"], "fetch");
            expect(servers).toHaveProperty(["initializer", "properties", 1, "initializer", "text"], "fetch");
        });

        test("should import custom form-data if importFetch option is passed", async () => {
            const schema = loadSpec("petstore.yml");
            const file = await generateClient(schema, { importFetch: "node-fetch" });

            const importFormData = file.statements[1] as ts.ImportDeclaration;
            expect(importFormData).toHaveProperty("kind", ts.SyntaxKind.ImportDeclaration);
            expect(importFormData).toHaveProperty("importClause.namedBindings.name.text", "FormData");
            expect(importFormData).toHaveProperty("moduleSpecifier.text", "form-data");
        });

        describe("with typesPath", () => {
            test("should output two separated files", async () => {
                const schema = loadSpec("petstore.yml");
                const res = await generateClient(schema, { typesPath: "./types" });

                expect(res).toHaveProperty("client");
                expect(res).toHaveProperty("types");
            });

            test("should generate types in separated file", async () => {
                const schema = loadSpec("petstore.yml");
                const { types } = await generateClient(schema, { typesPath: "./types" });

                const pet = core.findNode<ts.InterfaceDeclaration>(
                    types.statements,
                    ts.SyntaxKind.InterfaceDeclaration,
                    (node) => node.name.text === "Pet",
                );

                expect(pet).toHaveProperty(["name", "text"], "Pet");

                expect(pet).toHaveProperty(["members", 0, "name", "text"], "id");
                expect(pet).toHaveProperty(["members", 0, "type", "kind"], ts.SyntaxKind.NumberKeyword);

                expect(pet).toHaveProperty(["members", 1, "name", "text"], "name");
                expect(pet).toHaveProperty(["members", 1, "type", "kind"], ts.SyntaxKind.StringKeyword);

                expect(pet).toHaveProperty(["members", 2, "name", "text"], "tag");
                expect(pet).toHaveProperty(["members", 2, "type", "kind"], ts.SyntaxKind.StringKeyword);
            });

            test("should import types from typesPath", async () => {
                const schema = loadSpec("petstore.yml");
                const { client } = await generateClient(schema, { typesPath: "./types" });

                const importTypes = core.findNode<ts.ImportDeclaration>(client.statements, ts.SyntaxKind.ImportDeclaration);

                expect(importTypes).toHaveProperty(["importClause", "namedBindings", "elements", 0, "name", "escapedText"], "Pet");
                expect(importTypes).toHaveProperty("moduleSpecifier.text", "./types");
            });
        });
    });
});

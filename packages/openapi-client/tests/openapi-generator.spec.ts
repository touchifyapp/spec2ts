import * as ts from "typescript";
import * as core from "@spec2ts/core";

import { generateClient } from "../lib/openapi-generator";

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
                node => node.name?.text === "listPets"
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
                node => node.name?.text === "listPets"
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
                node => node.name?.text === "findPetById"
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
                node => node.name?.text === "deletePet"
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
                node => node.name?.text === "deletePet"
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
                node => node.name?.text === "deletePet"
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
                node => node.name?.text === "listPets"
            );

            expect(func).toHaveProperty(["type", "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["type", "typeName", "escapedText"], "Promise");
            expect(func).toHaveProperty(["type", "typeArguments", 0, "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["type", "typeArguments", 0, "typeName", "escapedText"], "ApiResponse");
            expect(func).toHaveProperty(["type", "typeArguments", 0, "typeArguments", 0, "kind"], ts.SyntaxKind.TypeReference);
            expect(func).toHaveProperty(["type", "typeArguments", 0, "typeArguments", 0, "typeName", "escapedText"], "Pets");
        });

        test("should generate a body parameter", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const file = await generateClient(schema);

            const func = core.findNode<ts.FunctionDeclaration>(
                file.statements,
                ts.SyntaxKind.FunctionDeclaration,
                node => node.name?.text === "addPet"
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
                node => node.name.text === "Pet"
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
                node => node.name.text === "Pets"
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
                node => node.name.text === "Error"
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
                    node => node.name.text === "Pet"
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

                const importTypes = core.findNode<ts.ImportDeclaration>(
                    client.statements,
                    ts.SyntaxKind.ImportDeclaration
                );

                expect(importTypes).toHaveProperty(["importClause", "namedBindings", "elements", 0, "name", "escapedText"], "Pet");
                expect(importTypes).toHaveProperty("moduleSpecifier.text", "./types");
            });

        });

    });

});

import { parseOpenApi } from "../lib/openapi-parser";

import { loadSpec } from "./helpers";

describe("openapi-parser", () => {

    describe(".parseOpenApi()", () => {

        test("should resolves with an object with parsed results", async () => {
            const schema = loadSpec("petstore.yml");
            const res = await parseOpenApi(schema);

            expect(res).toHaveProperty("import");
            expect(res).toHaveProperty("params");
            expect(res).toHaveProperty("query");
            expect(res).toHaveProperty("headers");
            expect(res).toHaveProperty("body");
            expect(res).toHaveProperty("responses");
            expect(res).toHaveProperty("models");
            expect(res).toHaveProperty("cookie");
            expect(res).toHaveProperty("all");
        });

        test("should resolve with a all property containing all results", async () => {
            const schema = loadSpec("petstore.yml");
            const res = await parseOpenApi(schema);

            expect(res.all).toHaveLength(
                res.import.length +
                res.params.length +
                res.query.length +
                res.headers.length +
                res.body.length +
                res.responses.length +
                res.models.length +
                res.cookie.length
            );
        });

        test("should export a type from operations path parameters", async () => {
            const schema = loadSpec("petstore.yml");
            const { params, all } = await parseOpenApi(schema);

            expect(all).toContain(params[0]);
            expect(params[0]).toHaveProperty("name.text", "ShowPetByIdParams");
        });

        test("should export a type for operations querystrings", async () => {
            const schema = loadSpec("petstore.yml");
            const { query, all } = await parseOpenApi(schema);

            expect(all).toContain(query[0]);
            expect(query[0]).toHaveProperty("name.text", "ListPetsQuery");
        });

        test("should export a type for operations headers", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const { headers, all } = await parseOpenApi(schema);

            expect(all).toContain(headers[0]);
            expect(headers[0]).toHaveProperty("name.text", "FindPetsHeaders");
        });

        test("should export a type with raw names for operations headers", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const { headers } = await parseOpenApi(schema);

            expect(headers[0]).toHaveProperty(["members", 0, "name", "text"], "X-Header");
        });

        test("should export a type with lower names for operations headers if lowerHeaders option is specified", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const { headers } = await parseOpenApi(schema, { lowerHeaders: true });

            expect(headers[0]).toHaveProperty(["members", 0, "name", "text"], "x-header");
        });

        test("should export a type for operations responses", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const { responses, all } = await parseOpenApi(schema);

            expect(all).toContain(responses[0]);
            expect(responses[0]).toHaveProperty("name.text", "FindPetsResponse");
        });

        test("should export a type for schemas in definitions", async () => {
            const schema = loadSpec("petstore-expanded.yml");
            const { models, all } = await parseOpenApi(schema);

            expect(all).toContain(models[0]);
            expect(models[0]).toHaveProperty("name.text", "NewPet");
        });

    });

});

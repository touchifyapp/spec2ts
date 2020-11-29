import {
    Argv
} from "yargs";

import {
    printer,
    cli
} from "@spec2ts/core";

import {
    parseOpenApiFile,
    ParseOpenApiOptions
} from "../lib/openapi-parser";

export interface BuildTsFromOpenApiOptions extends ParseOpenApiOptions {
    input: string | string[];
    output?: string;
    banner?: string;
}

export const usage = "$0 <input..>";

export const describe = "Generate TypeScript types from OpenAPI specification";

export function builder(argv: Argv): Argv<BuildTsFromOpenApiOptions> {
    return argv
        .positional("input", {
            array: true,
            type: "string",
            describe: "Path to OpenAPI Specification(s) to convert to TypeScript",
            demandOption: true
        })

        .option("output", {
            type: "string",
            alias: "o",
            describe: "Output directory for generated types"
        })
        .option("cwd", {
            type: "string",
            alias: "c",
            describe: "Root directory for resolving $refs"
        })

        .option("avoidAny", {
            type: "boolean",
            describe: "Avoid the `any` type and use `unknown` instead"
        })
        .option("enableDate", {
            choices: ["strict", "lax"] as const,
            default: "strict" as const,
            describe: "Build `Date` for format `date` and `date-time`"
        })

        .option("lowerHeaders", {
            type: "boolean",
            describe: "Lowercase headers keys to match Node.js standard"
        })

        .option("banner", {
            type: "string",
            alias: "b",
            describe: "Comment prepended to the top of each generated file"
        });
}

export async function handler(options: BuildTsFromOpenApiOptions): Promise<void> {
    const files = await cli.findFiles(options.input);

    for (const file of files) {
        const ast = await parseOpenApiFile(file, options);
        const content = printer.printNodes(ast.all);

        const output = cli.getOutputPath(file, options);
        await cli.mkdirp(output);

        await cli.writeFile(
            output,
            (options.banner || defaultBanner()) +
            "\n\n" +
            content
        );
    }
}

function defaultBanner(): string {
    return `/**
 * DO NOT MODIFY
 * Generated using @spec2ts/openapi.
 * See https://www.npmjs.com/package/@spec2ts/openapi
 */

/* eslint-disable */`;
}

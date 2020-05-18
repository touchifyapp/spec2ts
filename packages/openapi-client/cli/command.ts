import {
    Argv
} from "yargs";

import {
    printer,
    cli
} from "@spec2ts/core";

import {
    generateClientFromFile,
    OApiGeneratorOptions
} from "../lib/openapi-generator";

export interface BuildClientFromOpenApiOptions extends OApiGeneratorOptions {
    input: string | string[];
    output?: string;
    banner?: string;
}

export const usage = "$0 <input..>";

export const describe = "Generate TypeScript HTTP client from OpenAPI specification";

export function builder(argv: Argv): Argv<BuildClientFromOpenApiOptions> {
    return argv
        .positional("input", {
            array: true,
            type: "string",
            describe: "Path to OpenAPI Specification(s) to convert to TypeScript HTTP client",
            demandOption: true
        })

        .option("output", {
            type: "string",
            alias: "o",
            describe: "Output file for generated client"
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
        // .option("enableDate", {
        //     type: "boolean",
        //     describe: "Build `Date` for format `date` and `date-time`"
        // })

        .option("inlineRequired", {
            type: "boolean",
            describe: "Create a method argument for each required parameter"
        })
        .option("importFetch", {
            choices: ["node-fetch", "cross-fetch", "isomorphic-fetch"],
            describe: "Use a custom fetch implementation"
        })

        .option("banner", {
            type: "string",
            alias: "b",
            describe: "Comment prepended to the top of each generated file"
        });
}

export async function handler(options: BuildClientFromOpenApiOptions): Promise<void> {
    const files = await cli.findFiles(options.input);

    for (const file of files) {
        const sourceFile = await generateClientFromFile(file, options);
        const content = printer.printFile(sourceFile);

        const output = options.output || cli.getOutputPath(file, options);
        await cli.mkdirp(output);

        await cli.writeFile(
            output,
            options.banner || defaultBanner() +
            "\n\n" +
            content
        );
    }
}

function defaultBanner(): string {
    return `/**
 * DO NOT MODIFY
 * Generated using @spec2ts/openapi-client.
 * See https://www.npmjs.com/package/@spec2ts/openapi-client
 */

/* eslint-disable */`;
}

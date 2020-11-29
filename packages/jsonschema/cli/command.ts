import {
    Argv
} from "yargs";

import {
    printer,
    cli
} from "@spec2ts/core";

import {
    parseSchemaFile,
    ParseSchemaOptions
} from "../lib/schema-parser";

export interface BuildTsFromSchemaOptions extends ParseSchemaOptions {
    input: string | string[];
    output?: string;
    banner?: string;
}

export const usage = "$0 <input..>";

export const describe = "Generate TypeScript types from JSON Schemas";

export function builder(argv: Argv): Argv<BuildTsFromSchemaOptions> {
    return argv
        .positional("input", {
            array: true,
            type: "string",
            describe: "Path to JSON Schema(s) to convert to TypeScript",
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
            choices: [true, "strict", "lax"] as const,
            describe: "Build `Date` for format `date` and `date-time`"
        })

        .option("banner", {
            type: "string",
            alias: "b",
            describe: "Comment prepended to the top of each generated file"
        });
}

export async function handler(options: BuildTsFromSchemaOptions): Promise<void> {
    const files = await cli.findFiles(options.input);

    for (const file of files) {
        const ast = await parseSchemaFile(file, options);
        const content = printer.printNodes(ast);

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
 * Generated using @spec2ts/jsonschema.
 * See https://www.npmjs.com/package/@spec2ts/jsonschema
 */

/* eslint-disable */`;
}

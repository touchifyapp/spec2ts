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
            type: "boolean",
            describe: "Build `Date` for format `date` and `date-time`"
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
        const ast = await parseOpenApiFile(file);
        const content = printer.printNodes(ast.all);

        const output = cli.getOutputPath(file, options);
        cli.mkdirp(output);

        await cli.writeFile(
            output,
            options.banner ?
                options.banner + "\n\n" + content :
                content
        );
    }
}

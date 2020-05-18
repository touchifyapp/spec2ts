import * as path from "path";
import { promises as fs } from "fs";

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

    packageName?: boolean;
    packageVersion?: string;
    packageAuthor?: string;
    packageLicense?: string;
    packagePrivate?: boolean;
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

        .option("packageName", {
            type: "string",
            describe: "Generate a package.json with given name"
        })
        .option("packageVersion", {
            type: "string",
            describe: "Sets the version of the package.json"
        })
        .option("packageAuthor", {
            type: "string",
            describe: "Sets the author of the package.json"
        })
        .option("packageLicense", {
            type: "string",
            describe: "Sets the license of the package.json"
        })
        .option("packagePrivate", {
            type: "boolean",
            describe: "Sets the package.json private"
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

        if (options.packageName) {
            await generatePackage(output, options);
        }
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

async function generatePackage(output: string, options: BuildClientFromOpenApiOptions): Promise<void> {
    const outputDir = path.dirname(output);

    const pkg: Record<string, any> = {
        name: options.packageName,
        version: options.packageVersion || "1.0.0",
        description: "OpenAPI v3 client for " + options.packageName,
        author: options.packageAuthor || "@spec2ts/openapi-client",
        license: options.packageLicense || "UNLICENSED",
        main: path.relative(outputDir, output),
        files: ["*.js", "*.d.ts"],
        scripts: {
            build: "tsc -p ."
        },
        dependencies: {},
        devDependencies: {
            typescript: "^3.0.0"
        }
    };

    if (options.importFetch) {
        pkg.dependencies[options.importFetch] = "*"
    }

    if (options.packagePrivate) {
        pkg.private = options.packagePrivate;
    }

    await fs.writeFile(path.join(outputDir, "package.json"), JSON.stringify(pkg, null, 2), "utf8");
}

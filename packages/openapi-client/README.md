# @spec2ts/openapi-client

[![NPM version](https://img.shields.io/npm/v/@spec2ts/openapi-client.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/openapi-client)
[![NPM download](https://img.shields.io/npm/dm/@spec2ts/openapi-client.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/openapi-client)
[![Build Status](https://travis-ci.org/touchifyapp/spec2ts.svg?branch=master)](https://travis-ci.org/touchifyapp/spec2ts)

`@spec2ts/openapi-client` is an utility to create a TypeScript HTTP Client with entity types from OpenAPI v3 specification. Unlike other code generators `@spec2ts/openapi-client` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree (AST).

## Features

* **AST-based:** Unlike other code generators `@spec2ts/openapi-client` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree.
* **Tree-shakeable:** Individually exported types allows you to bundle only the ones you actually use.
* **YAML or JSON:** Use YAML or JSON for your OpenAPI v3 specification.
* **External references:** Resolves automatically external references and bundle or import them in generated files.
* **Implementation agnostic:** Use generated types in any projet or framework.

## Installation

Install in your project:
```bash
npm install @spec2ts/openapi-client
```

## CLI Usage

```
oapi2tsclient <input..>

Generate TypeScript HTTP client from OpenAPI specification

Positionals:
  input  Path to OpenAPI Specification(s) to convert to TypeScript HTTP client
                                                                        [string]

Options:
  --version         Show version number                                [boolean]
  --help            Show help usage                                    [boolean]
  --output, -o      Output file for generated client                    [string]
  --cwd, -c         Root directory for resolving $refs                  [string]
  --avoidAny        Avoid the `any` type and use `unknown` instead     [boolean]
  --inlineRequired  Create a method argument for each required parameter
                                                                       [boolean]
  --importFetch     Use a custom fetch implementation
                      [choices: "node-fetch", "cross-fetch", "isomorphic-fetch"]
  --packageName     Generate a package.json with given name             [string]
  --packageVersion  Sets the version of the package.json                [string]
  --packageAuthor   Sets the author of the package.json                 [string]
  --packageLicense  Sets the license of the package.json                [string]
  --packagePrivate  Sets the package.json private                      [boolean]
  --banner, -b      Comment prepended to the top of each generated file [string]
```

## Programmatic Usage

```typescript
import { printer } from "@spec2ts/core";
import { generateClientFile } from "@spec2ts/openapi-client";

async function generate(path: string): Promise<string> {
    const result = await generateClientFile(path);
    return printer.printNodes(result);
}
```

## Compatibility Matrix

| TypeScript version | spec2ts version |
|--------------------|-----------------|
| v3.x.x             | v1              | 
| v4.x.x             | v2              | 

## License

This project is under MIT License. See the [LICENSE](LICENSE) file for the full license text.

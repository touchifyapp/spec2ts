# @spec2ts/openapi

[![NPM version](https://img.shields.io/npm/v/@spec2ts/openapi.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/openapi)
[![NPM download](https://img.shields.io/npm/dm/@spec2ts/openapi.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/openapi)
[![Build Status](https://travis-ci.org/touchifyapp/spec2ts.svg?branch=master)](https://travis-ci.org/touchifyapp/spec2ts)

`@spec2ts/openapi` is an utility to create TypeScript types from OpenAPI v3 specification. Unlike other code generators `@spec2ts/openapi` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree (AST).

## Features

* **AST-based:** Unlike other code generators `@spec2ts/openapi` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree.
* **Tree-shakeable:** Individually exported types allows you to bundle only the ones you actually use.
* **YAML or JSON:** Use YAML or JSON for your OpenAPI v3 specification.
* **External references:** Resolves automatically external references and bundle or import them in generated files.
* **Implementation agnostic:** Use generated types in any projet or framework.

## Installation

Install in your project:
```bash
npm install @spec2ts/openapi
```

## CLI Usage

```bash
oapi2ts [options] <input..>

Generate TypeScript types from OpenAPI specification

Positionals:
  input  Path to OpenAPI Specification(s) to convert to TypeScript      [string]

Options:
  --version     Show version number                                    [boolean]
  --help        Show help usage                                        [boolean]
  --output, -o  Output directory for generated types                    [string]
  --cwd, -c     Root directory for resolving $refs                      [string]
  --avoidAny    Avoid the `any` type and use `unknown` instead         [boolean]
  --enableDate  Build `Date` for format `date` and `date-time`         [boolean]
  --banner, -b  Comment prepended to the top of each generated file     [string]
```

## Programmatic Usage

```typescript
import { printer } from "@spec2ts/core";
import { parseOpenApiFile } from "@spec2ts/openapi";

async function generateSpec(path: string): Promise<string> {
    const result = await parseOpenApiFile(path);
    return printer.printNodes(result);
}
```

## Implementations

- [x] Types for parameters:
  - [x] path
  - [x] header
  - [x] query
  - [x] cookie
- [x] Types for requestBody
- [x] Types for responses
- [x] Automatic naming
  - [x] From operationId
  - [x] From path
- [x] Parameters merging
  - [x] From path item
  - [x] From operation
  - [x] Override from operation
- [x] [Schema references](http://json-schema.org/latest/json-schema-core.html#rfc.section.7.2.2)
  - [x] Local (filesystem) schema references
  - [x] External (network) schema references
- [x] Modular architecture
  - [x] Import local references
  - [x] Embed external references

## License

This project is under MIT License. See the [LICENSE](LICENSE) file for the full license text.

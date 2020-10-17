# @spec2ts/cli

[![NPM version](https://img.shields.io/npm/v/@spec2ts/cli.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/cli)
[![NPM download](https://img.shields.io/npm/dm/@spec2ts/cli.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/cli)
[![Build Status](https://travis-ci.org/touchifyapp/spec2ts.svg?branch=master)](https://travis-ci.org/touchifyapp/spec2ts)

`@spec2ts/cli` is an utility to create TypeScript types from JSON schemas or OpenAPI v3 specifications. Unlike other code generators `@spec2ts/cli` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree (AST).

## Features

* **AST-based:** Unlike other code generators `@spec2ts/cli` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree.
* **Tree-shakeable:** Individually exported types allows you to bundle only the ones you actually use.
* **YAML or JSON:** Use YAML or JSON for your specifications.
* **External references:** Resolves automatically external references and bundle or import them in generated files.
* **Implementation agnostic:** Use generated types in any projet or framework.

## Installation

Install in your project:
```bash
npm install @spec2ts/cli
```

## CLI Usage

#### JSON Schema command

```bash
spec2ts jsonschema [options] <input..>

Generate TypeScript types from JSON Schemas

Positionals:
  input  Path to JSON Schema(s) to convert to TypeScript                [string]

Options:
  --version     Show version number                                    [boolean]
  --help        Show help usage                                        [boolean]
  --output, -o  Output directory for generated types                    [string]
  --cwd, -c     Root directory for resolving $refs                      [string]
  --avoidAny    Avoid the `any` type and use `unknown` instead         [boolean]
  --enableDate  Build `Date` for format `date` and `date-time`         [boolean]
  --banner, -b  Comment prepended to the top of each generated file     [string]
```

#### OpenAPI command

```bash
spec2ts openapi [options] <input..>

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

## Implementations

- **JSON Schema:** See `@spec2ts/jsonschema`'s [documentation](https://github.com/touchifyapp/spec2ts/blob/master/packages/jsonschema/README.md).
- **Open API Specification:** See `@spec2ts/openapi`'s [documentation](https://github.com/touchifyapp/spec2ts/blob/master/packages/openapi/README.md).

## Compatibility Matrix

| TypeScript version | spec2ts version |
|--------------------|-----------------|
| v3.x.x             | v1              | 
| v4.x.x             | v2              | 

## License

This project is under MIT License. See the [LICENSE](LICENSE) file for the full license text.

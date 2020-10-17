# @spec2ts/jsonschema

[![NPM version](https://img.shields.io/npm/v/@spec2ts/jsonschema.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/jsonschema)
[![NPM download](https://img.shields.io/npm/dm/@spec2ts/jsonschema.svg?style=flat-square)](https://npmjs.org/package/@spec2ts/jsonschema)
[![Build Status](https://travis-ci.org/touchifyapp/spec2ts.svg?branch=master)](https://travis-ci.org/touchifyapp/spec2ts)

`@spec2ts/jsonschema` is an utility to create TypeScript types from JSON schemas. Unlike other code generators `@spec2ts/jsonschema` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree (AST).

## Features

* **AST-based:** Unlike other code generators `@spec2ts/jsonschema` does not use templates to generate code but uses TypeScript's built-in API to generate and pretty-print an abstract syntax tree.
* **Tree-shakeable:** Individually exported types allows you to bundle only the ones you actually use.
* **YAML or JSON:** Use YAML or JSON for your JSON Schemas.
* **External references:** Resolves automatically external references and bundle or import them in generated files.
* **Implementation agnostic:** Use generated types in any projet or framework.

## Installation

Install in your project:
```bash
npm install @spec2ts/jsonschema
```

## CLI Usage

```bash
jsonschema2ts [options] <input..>

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

## Programmatic Usage

```typescript
import { printer } from "@spec2ts/core";
import { parseSchema, JSONSchema } from "@spec2ts/jsonschema";

async function generateSchema(schema: JSONSchema): Promise<string> {
    const result = await parseSchema(schema);
    return printer.printNodes(result);
}
```

## Implementations

- [x] Primitive types:
  - [x] array
  - [x] boolean
  - [x] integer
  - [x] number
  - [x] null
  - [x] object
  - [x] string
  - [x] homogeneous enum
  - [x] heterogeneous enum
- [x] Special types:
  - [x] Date (`date` and `date-time` formats)
  - [x] Blob (`binary` format)
- [x] Automatic type naming:
  - [x] From `id`
  - [x] From `path`
  - [x] From `title`
- [ ] Custom JSON-schema extensions
- [x] Nested properties
- [x] Schema definitions
- [x] [Schema references](http://json-schema.org/latest/json-schema-core.html#rfc.section.7.2.2)
  - [x] Local (filesystem) schema references
  - [x] External (network) schema references
- [x] Modular architecture
  - [x] Import local references
  - [x] Embed external references
- [x] `allOf` ("intersection")
- [x] `anyOf` ("union")
- [x] `oneOf` (treated like `anyOf`)
- [ ] `maxItems`
- [ ] `minItems`
- [x] `additionalProperties` of type
- [ ] `patternProperties` (partial support)
- [x] `extends` (with `allOf`)
- [x] `required` properties on objects
- [ ] `validateRequired`
- [ ] literal objects in enum
- [x] referencing schema by id

## Compatibility Matrix

| TypeScript version | spec2ts version |
|--------------------|-----------------|
| v3.x.x             | v1              | 
| v4.x.x             | v2              | 

## License

This project is under MIT License. See the [LICENSE](LICENSE) file for the full license text.

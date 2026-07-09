import type $RefParser from "@apidevtools/json-schema-ref-parser";

import { readFileSync } from "fs";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsYaml = require("js-yaml");
type JSONSchema = NonNullable<$RefParser["schema"]>;

export function loadSchema(file: string): JSONSchema {
    return loadFile<JSONSchema>(file);
}

export function getAssetsPath(file?: string): string {
    return file ? path.join(import.meta.dirname, "assets", file) : path.join(import.meta.dirname, "assets");
}

function loadFile<T>(file: string): T {
    if (file.endsWith(".json")) {
        return require("./assets/" + file);
    }

    if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        return jsYaml.load(readFileSync(path.join(import.meta.dirname, "assets", file), "utf8"));
    }

    throw new Error("Unsupported extension: " + file);
}

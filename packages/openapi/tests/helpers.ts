import type { OpenAPIObject } from "openapi3-ts/oas31";

import { readFileSync } from "fs";
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsYaml = require("js-yaml");

export function loadSpec(file: string): OpenAPIObject {
    return loadFile<OpenAPIObject>(file);
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

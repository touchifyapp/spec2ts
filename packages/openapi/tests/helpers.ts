import * as path from "path";
import { readFileSync } from "fs";

import type { OpenAPIObject } from "openapi3-ts/oas30";

const jsYaml = require("js-yaml");

export function loadSpec(file: string): OpenAPIObject {
    return loadFile<OpenAPIObject>(file);
}

export function getAssetsPath(file?: string): string {
    return file ?
        path.join(__dirname, "assets", file) :
        path.join(__dirname, "assets");
}

function loadFile<T>(file: string): T {
    if (file.endsWith(".json")) {
        return require("./assets/" + file);
    }

    if (file.endsWith(".yml") || file.endsWith(".yaml")) {
        return jsYaml.load(readFileSync(path.join(__dirname, "assets", file), "utf8"));
    }

    throw new Error("Unsupported extension: " + file);
}
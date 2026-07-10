import { defineConfig } from "tsdown";

export default defineConfig([
    {
        entry: ["src/index.ts", "src/cli/index.ts", "src/bin/jsonschema2ts.ts"],
        platform: "node",
        dts: {
            tsgo: {
                path: import.meta.dirname + "/../../node_modules/typescript/bin/tsc",
            },
        },
    },
]);

import { defineConfig } from "tsdown";

export default defineConfig({
    platform: "node",
    dts: {
        tsgo: {
            path: import.meta.dirname + "/../../node_modules/typescript/bin/tsc",
        },
    },
});

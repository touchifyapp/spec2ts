import { defineConfig } from "tsdown";

export default defineConfig({
    entry: "src/spec2ts.ts",
    outDir: "bin",
    platform: "node",
    dts: false,
});
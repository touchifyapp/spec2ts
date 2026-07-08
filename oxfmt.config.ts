import { defineConfig } from "oxfmt";

export default defineConfig({
    tabWidth: 4,
    printWidth: 140,
    trailingComma: "all",
    ignorePatterns: ["**/dist/**", "**/node_modules/**"],
    sortImports: {
        groups: [
            ["type-builtin", "type-external"],
            ["type-parent", "type-sibling", "type-index"],
            "type-internal",
            ["value-builtin", "value-external"],
            "value-internal",
            ["value-parent", "value-sibling", "value-index"],
            "unknown",
        ],
    },
    overrides: [{ files: ["*.json"], options: { tabWidth: 2 } }],
});

import { defineConfig } from "oxlint";

export default defineConfig({
    options: {
        typeAware: true,
        typeCheck: true,
    },
    env: {
        node: true,
    },
    ignorePatterns: ["**/dist/**", "**/node_modules/**"],
    rules: {
        "typescript/no-explicit-any": "off",
        "typescript/no-use-before-define": ["error", { functions: false, classes: false, typedefs: false }],
        "typescript/explicit-function-return-type": ["error", { allowExpressions: true }],
        "typescript/array-type": ["error", { default: "array-simple" }],
    },
});

/** @type import("@jest/types").Config.InitialOptions */
const config = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.spec.ts"],

    transform: {
        // eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
        ...require("ts-jest/presets").defaults.transform,
    },
};

// eslint-disable-next-line no-undef
module.exports = config;
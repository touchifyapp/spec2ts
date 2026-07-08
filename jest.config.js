import presets from "ts-jest/presets/index.js";

/** @type import("@jest/types").Config.InitialOptions */
const config = {
    ...presets.defaultsESM,

    testEnvironment: "node",
    testMatch: ["**/tests/**/*.spec.ts"],

    // transform: {
    //     // eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
    //     ...require("ts-jest/presets").defaultsESM,
    // },
};

console.log(config);

// eslint-disable-next-line no-undef
export default config;
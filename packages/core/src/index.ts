export * from "./lib/common";
export * from "./lib/declaration";
export * from "./lib/expression";
export * from "./lib/finder";
export * from "./lib/sourcefile";
export * from "./lib/statement";

import * as $cli from "./lib/cli";
import * as $printer from "./lib/printer";

export const cli = { ...$cli };
export const printer = { ...$printer };

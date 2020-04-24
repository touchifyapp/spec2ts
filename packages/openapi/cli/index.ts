import * as yargs from "yargs";

import {
    usage,
    describe,
    builder,
    handler
} from "../cli/command";

yargs
    .command(usage, describe, builder, handler)
    .help("help", "Show help usage")
    .demandCommand()
    .argv;

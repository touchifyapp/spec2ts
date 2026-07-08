#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { usage, describe, builder, handler } from "../cli/command";

void yargs(hideBin(process.argv)).command(usage, describe, builder, handler).help("help", "Show help usage").demandCommand().argv;

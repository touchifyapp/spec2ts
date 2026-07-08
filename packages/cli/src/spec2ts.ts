#!/usr/bin/env node

import * as jsonschema from "@spec2ts/jsonschema/cli";
import * as openapiClient from "@spec2ts/openapi-client/cli";
import * as openapi from "@spec2ts/openapi/cli";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

void yargs(hideBin(process.argv))
    .command(jsonschema.usage.replace("$0", "jsonschema"), jsonschema.describe, jsonschema.builder, jsonschema.handler)

    .command(openapi.usage.replace("$0", "openapi"), openapi.describe, openapi.builder, openapi.handler)

    .command(openapiClient.usage.replace("$0", "openapi-client"), openapiClient.describe, openapiClient.builder, openapiClient.handler)

    .help("help", "Show help usage")
    .demandCommand().argv;

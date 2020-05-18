#!/usr/bin/env node

import * as yargs from "yargs";

import * as jsonschema from "@spec2ts/jsonschema/cli/command";
import * as openapi from "@spec2ts/openapi/cli/command";
import * as openapiClient from "@spec2ts/openapi-client/cli/command";

yargs
    .command(
        jsonschema.usage.replace("$0", "jsonschema"),
        jsonschema.describe,
        jsonschema.builder,
        jsonschema.handler
    )

    .command(
        openapi.usage.replace("$0", "openapi"),
        openapi.describe,
        openapi.builder,
        openapi.handler
    )

    .command(
        openapiClient.usage.replace("$0", "openapi-client"),
        openapiClient.describe,
        openapiClient.builder,
        openapiClient.handler
    )

    .help("help", "Show help usage")
    .demandCommand()

    .argv;

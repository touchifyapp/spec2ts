# Contributing to spec2ts 

> Please note that this project is released with a [Contributor Code of Conduct](./CODE_OF_CONDUCT.md). 
> By participating in this project you agree to abide by its terms. 

First, ensure you have the [latest `npm`](https://docs.npmjs.com/). 

To get started with the repo: 

```sh
$ git clone git@github.com:touchifyapp/spec2ts.git && cd spec2ts 
$ npm ci
```

## Code Structure 

Currently, the [source](https://github.com/touchifyapp/spec2ts/tree/master) is a [lerna](https://github.com/lerna/lerna) monorepo containing the following components, located in the `packages` directory: 
- `core`: Helpers methods to generate TypeScript code. 
- `jsonschema`: Utility to generate types from JSON schemas. [More details](https://github.com/touchifyapp/spec2ts/blob/master/packages/jsonschema/README.md). 
- `openapi`: Utility to generate types from Open API v3 specifications. [More details](https://github.com/touchifyapp/spec2ts/blob/master/packages/openapi/README.md). 
- `openapi-client`: Utility to generate HTTP Client from Open API v3 specifications. [More details](https://github.com/touchifyapp/spec2ts/blob/master/packages/openapi-client/README.md). 
- `cli`: CLI wrapper to generate types from Open API v3 specifications and JSON schemas. [More details](https://github.com/touchifyapp/spec2ts/blob/master/packages/cli/README.md). 

## Commands 

Commands are handled by npm scripts, and can be executed: 
- from a package directory using `npm run <cmd>` (acts on one package) 
- from the root directory using `npm run <cmd>` (acts on all packages) 
- from the root directory using `lerna run <cmd>` (acts on each packages containing this `cmd`) 

### Build 

```sh
$ npm run build 
# or using lerna, prefix with `npx` or install globally
$ lerna run build 
```

### Unit Tests 

```sh
# Run all test suites 
$ npm run test 
# or using lerna, prefix with `npx` or install globally
$ lerna run test 

# Run a specific suite from a file (e.g. packages/openapi/tests/openapi-parser.spec.ts from root directory) 
$ npm run test packages/openapi/tests/openapi-parser.spec.ts 

# Use pattern matching 
$ npm run test openapi-parser 

# Skip cleanup and linting 
$ npm run test:jest 
# etc 
```

### Coverage 

If you would like to check test coverage, run the coverage command then open `coverage/lcov-report/index.html` in your favorite browser. 

```sh
# Generate coverage reports 
$ npm test:coverage 

# Open reports with OS X 
$ open coverage/lcov-report/index.html 

# Open reports with Linux 
$ xdg-open coverage/lcov-report/index.html 
```

### Lint 

```sh
$ npm run lint 
```

It's also a good idea to hook up your editor to an eslint plugin. 

To fix lint errors from the command line: 

```sh
$ npm run lint:fix
```

### Local CLI Testing 

Lerna handles dependencies between packages through symlinks so local packages are kept up to date regarding one another. 
To test out a development build of spec2ts or any other subcommand, simply execute the spec2ts cli using `node`. 

Exemple for @spec2ts/openapi specifying output location with `-o <output>` option: 
```sh
$ lerna run build
$ cd packages/cli
$ node ./bin/spec2ts.js openapi ../openapi/tests/assets/petstore.yml -o .

# without build using ts-node, prefix with npx or install globally
$ ts-node ./bin/spec2ts.ts openapi ../openapi/tests/assets/petstore.yml -o .
```

## Issue 

We use (GitHub Issues)[https://github.com/touchifyapp/spec2ts/issues] for bug reports and feature requests. 
Before filling a new issue, try to make sure your problem doesn't already exist. If not, use the provided templates to provide a clear description. 

## Pull Request 

This project follows [GitHub's standard forking model](https://guides.github.com/activities/forking/). Please fork the project to submit pull requests. 
Any new feature must be accompanied by: 
- a description expliciting the idea behing the feature 
- a documentation of the usage 
- valid tests covering the feature 

## Release

> Maintainers only.

Packages are versioned independently from [Conventional Commits](https://www.conventionalcommits.org/) (`fix:` bumps the patch version, `feat:` the minor version, and a breaking change the major version).
Releasing has two steps: bump the versions locally through a pull request, then let the CI publish to npm.

### 1. Bump versions

`master` only accepts changes through pull requests, so versions are bumped on a `@release/*` branch:

```sh
git checkout master && git pull
git checkout -b @release/$(date +%Y-%m-%d)
npm run release
```

`npm run release` runs `lerna version`, which:
- computes the next version of each changed package from the commits since its last tag;
- updates the `package.json` files, including the ranges of internal `@spec2ts/*` dependencies, and `package-lock.json`;
- updates the `CHANGELOG.md` files.

It does not commit, tag or push. Review the changes, then commit them and open a pull request:

```sh
git commit -am "chore(release): publish packages"
git push -u origin HEAD
gh pr create --fill
```

Do not tag the release branch: pull requests are squashed or rebased, so tags would not point to commits on `master`.

### 2. Publish

When the release pull request is merged, the [Release workflow](.github/workflows/release.yml) runs on `master`:
1. It lists the packages whose version in `package.json` is not yet published on npm. If there are none, it stops there.
2. It waits for approval on the `npm` environment.
3. It runs `lerna publish from-package`, using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). No npm token or OTP is needed, and packages are published with provenance.
4. It tags each published version (`@spec2ts/<package>@<version>`) on the `master` commit.

If publishing fails partway, re-run the workflow (or run it manually with *Run workflow*): it only publishes and tags the versions that are still missing.

Each package must have a trusted publisher configured on npmjs.com (repository `touchifyapp/spec2ts`, workflow `release.yml`, environment `npm`). A new package must be published manually once before its trusted publisher can be configured.

## License 
By contributing to spec2ts, you agree that your contributions will be licensed under its MIT license. 

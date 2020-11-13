# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-beta.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.4.2...@spec2ts/jsonschema@2.0.0-beta.0) (2020-11-13)


### Bug Fixes

* **jsonschema:** incluce numbers in pascalCase ([13c87c3](https://github.com/touchifyapp/spec2ts/commit/13c87c3d5d5a7c550e46d9cddfc9de617c6263b6))


### Features

* **global:** upgrade typescript 4 ([#16](https://github.com/touchifyapp/spec2ts/issues/16)) ([fcd82be](https://github.com/touchifyapp/spec2ts/commit/fcd82be93be3986a2f723680f1c52818eb7ba1bc))


### BREAKING CHANGES

* **global:** use typescript v4
* **global:** updates are now immutable





## [1.4.2](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.4.1...@spec2ts/jsonschema@1.4.2) (2020-10-26)


### Bug Fixes

* **jsonschema,openapi:** cover more nested refs cases ([1badafb](https://github.com/touchifyapp/spec2ts/commit/1badafbe0865a186ef5fc92bfc0ab5b334d4fa6e))





## [1.4.1](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.4.0...@spec2ts/jsonschema@1.4.1) (2020-10-26)


### Bug Fixes

* **jsonschema,openapi:** nested references not resolved ([9825a40](https://github.com/touchifyapp/spec2ts/commit/9825a405630c101e7a70452ce3a18e02ccad9ce8)), closes [#15](https://github.com/touchifyapp/spec2ts/issues/15)





# [1.4.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.3.1...@spec2ts/jsonschema@1.4.0) (2020-10-06)


### Features

* **jsonschema:** add const parsing ([d0db5f1](https://github.com/touchifyapp/spec2ts/commit/d0db5f1dac8a020a99407a942c3a39abc3a89a48)), closes [#3](https://github.com/touchifyapp/spec2ts/issues/3)





## [1.3.1](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.3.0...@spec2ts/jsonschema@1.3.1) (2020-05-27)


### Bug Fixes

* **jsonschema:** improve external references parsing ([23f3868](https://github.com/touchifyapp/spec2ts/commit/23f3868980a78ad880237dfdff829e7b3e5a4d6e)), closes [#1](https://github.com/touchifyapp/spec2ts/issues/1)





# [1.3.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.2.0...@spec2ts/jsonschema@1.3.0) (2020-05-24)


### Features

* **cli:** add default banner ([b0945e0](https://github.com/touchifyapp/spec2ts/commit/b0945e08b2c1da4dc494dca1890d491768a13e60))





# [1.2.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.1.0...@spec2ts/jsonschema@1.2.0) (2020-05-18)


### Features

* **core:** improve type generation ([7abd848](https://github.com/touchifyapp/spec2ts/commit/7abd84800ce27d81a7868d4ec0a67f28bf26b355))





# [1.1.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/jsonschema@1.0.0...@spec2ts/jsonschema@1.1.0) (2020-05-16)


### Features

* **jsonschema:** add parseReference option ([1b8f637](https://github.com/touchifyapp/spec2ts/commit/1b8f637725bc3e4a4499656d5dbd213ddaecd860))





# 1.0.0 (2020-04-24)


### Bug Fixes

* **release:** fix lerna publish ([fe36558](https://github.com/touchifyapp/spec2ts/commit/fe36558a1a2742e2e3d99aa08061ab9be0cf03f2))


### Code Refactoring

* **jsonschema:** create lib base structure ([7365f94](https://github.com/touchifyapp/spec2ts/commit/7365f94ae0d32a3ef427dce02891c602f98a5edc))


### Features

* **jsonschema:** add cli command ([7592c43](https://github.com/touchifyapp/spec2ts/commit/7592c439be99fabb97cc270aa7a09794ee86f738))
* **openapi:** add openapi parser to monorepo ([e9ca537](https://github.com/touchifyapp/spec2ts/commit/e9ca5375e2692f909d32eacae653f918cd348040))


### BREAKING CHANGES

* **jsonschema:** no more printer in library

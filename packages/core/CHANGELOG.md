# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.0.0-beta.2](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@2.0.0-beta.1...@spec2ts/core@2.0.0-beta.2) (2022-01-27)


### Bug Fixes

* make imports works with typescript 4.5 ([78f54b8](https://github.com/touchifyapp/spec2ts/commit/78f54b81a6ccfaff42dbbe640ffbd1afbc41f8bb))





# [2.0.0-beta.1](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@2.0.0-beta.0...@spec2ts/core@2.0.0-beta.1) (2021-10-23)


### Features

* allow --ext option to specify output extension ([4c70ca1](https://github.com/touchifyapp/spec2ts/commit/4c70ca13f3fc12ce1fd16c0430c7f90f90b0ed64))





# [2.0.0-beta.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@1.2.2...@spec2ts/core@2.0.0-beta.0) (2020-11-13)


### Bug Fixes

* core avoid any ([af8e7ef](https://github.com/touchifyapp/spec2ts/commit/af8e7efe9e073e07f98c6962e94cef6cbe98212e))


### Features

* **global:** upgrade typescript 4 ([#16](https://github.com/touchifyapp/spec2ts/issues/16)) ([fcd82be](https://github.com/touchifyapp/spec2ts/commit/fcd82be93be3986a2f723680f1c52818eb7ba1bc))


### BREAKING CHANGES

* **global:** use typescript v4
* **global:** updates are now immutable





## [1.2.2](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@1.2.1...@spec2ts/core@1.2.2) (2020-10-26)

**Note:** Version bump only for package @spec2ts/core





## [1.2.1](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@1.2.0...@spec2ts/core@1.2.1) (2020-05-27)


### Bug Fixes

* **jsonschema:** improve external references parsing ([23f3868](https://github.com/touchifyapp/spec2ts/commit/23f3868980a78ad880237dfdff829e7b3e5a4d6e)), closes [#1](https://github.com/touchifyapp/spec2ts/issues/1)





# [1.2.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@1.1.0...@spec2ts/core@1.2.0) (2020-05-24)


### Features

* **core:** add new imports utils ([f8329b8](https://github.com/touchifyapp/spec2ts/commit/f8329b8772ea5b7dcfde5ec28830a921223eb8bf))





# [1.1.0](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@1.0.1...@spec2ts/core@1.1.0) (2020-05-18)


### Features

* **core:** add new methods : ([f4dfc6d](https://github.com/touchifyapp/spec2ts/commit/f4dfc6d98848cc95512b38c1aea5c9fb016e275a))
* **core:** improve type generation ([7abd848](https://github.com/touchifyapp/spec2ts/commit/7abd84800ce27d81a7868d4ec0a67f28bf26b355))





## [1.0.1](https://github.com/touchifyapp/spec2ts/compare/@spec2ts/core@1.0.0...@spec2ts/core@1.0.1) (2020-05-16)

**Note:** Version bump only for package @spec2ts/core





# 1.0.0 (2020-04-24)


### Bug Fixes

* **release:** fix lerna publish ([fe36558](https://github.com/touchifyapp/spec2ts/commit/fe36558a1a2742e2e3d99aa08061ab9be0cf03f2))


### Code Refactoring

* **jsonschema:** create lib base structure ([7365f94](https://github.com/touchifyapp/spec2ts/commit/7365f94ae0d32a3ef427dce02891c602f98a5edc))


### Features

* **jsonschema:** add cli command ([7592c43](https://github.com/touchifyapp/spec2ts/commit/7592c439be99fabb97cc270aa7a09794ee86f738))
* **openapi:** add openapi parser to monorepo ([e9ca537](https://github.com/touchifyapp/spec2ts/commit/e9ca5375e2692f909d32eacae653f918cd348040))


* refactor(core)!: refactor core package ([1e59d55](https://github.com/touchifyapp/spec2ts/commit/1e59d55ec6342cd56510876f9f31a948bb1f272b))


### BREAKING CHANGES

* **jsonschema:** no more printer in library
* methods does not throw

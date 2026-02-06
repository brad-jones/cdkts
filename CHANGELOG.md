# Changelog
All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -
## [v0.3.0](https://github.com/brad-jones/cdkts/compare/0c9c2be483375075cb0c4000090937acab7eca58..v0.3.0) - 2026-02-06
#### Features
- (**cli**) added an installer - ([0c9c2be](https://github.com/brad-jones/cdkts/commit/0c9c2be483375075cb0c4000090937acab7eca58)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.9](https://github.com/brad-jones/cdkts/compare/5d36172c5b0b395de454a76f887983ca807c0377..v0.2.9) - 2026-02-06
#### Documentation
- added module doc comments to bump up our score on jsr :) - ([5d36172](https://github.com/brad-jones/cdkts/commit/5d36172c5b0b395de454a76f887983ca807c0377)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.8](https://github.com/brad-jones/cdkts/compare/5cd7fe1241aa06cdeb2c8fa580b31d0a6deb571b..v0.2.8) - 2026-02-06
#### Documentation
- added a readme - ([5cd7fe1](https://github.com/brad-jones/cdkts/commit/5cd7fe1241aa06cdeb2c8fa580b31d0a6deb571b)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.7](https://github.com/brad-jones/cdkts/compare/0eaeea96c40569008fbbf5d47e586fc043a4c3cd..v0.2.7) - 2026-02-06
#### Documentation
- (**examples**) added notes about some limitations the system currently has - ([7cfca51](https://github.com/brad-jones/cdkts/commit/7cfca51b3a76d23865cc5f1bc4cea7c8f86d2be7)) - [@brad-jones](https://github.com/brad-jones)
- add jsdocs to basically everything that was missing docs - ([8a508c7](https://github.com/brad-jones/cdkts/commit/8a508c731205c590e2c5085c8ce7477907597cc0)) - [@brad-jones](https://github.com/brad-jones)
#### Refactoring
- don't use deprecated zod url validation - ([894d225](https://github.com/brad-jones/cdkts/commit/894d2256011d336712e803bd38c7e7497a3068a3)) - [@brad-jones](https://github.com/brad-jones)
#### Miscellaneous Chores
- bump pixi lock file - ([0eaeea9](https://github.com/brad-jones/cdkts/commit/0eaeea96c40569008fbbf5d47e586fc043a4c3cd)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.6](https://github.com/brad-jones/cdkts/compare/f785c32ef4424d87a53725adb9c8af771d2ac5e6..v0.2.6) - 2026-02-05
#### Bug Fixes
- (**bundler**) now working with JSR as intended - ([f785c32](https://github.com/brad-jones/cdkts/commit/f785c32ef4424d87a53725adb9c8af771d2ac5e6)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.5](https://github.com/brad-jones/cdkts/compare/b7ecad3d07e09d57f712f3070ed14aa12f04a3c6..v0.2.5) - 2026-02-05
#### Bug Fixes
- (**bundler**) update getDenoCompileRootDir to not rely on import.meta - ([b7ecad3](https://github.com/brad-jones/cdkts/commit/b7ecad3d07e09d57f712f3070ed14aa12f04a3c6)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.4](https://github.com/brad-jones/cdkts/compare/096c0d2b84a41a191066b5942ffbaee83a3eab91..v0.2.4) - 2026-02-05
#### Bug Fixes
- (**bundler**) debug why getDenoCompileRootDir is not working - ([096c0d2](https://github.com/brad-jones/cdkts/commit/096c0d2b84a41a191066b5942ffbaee83a3eab91)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.3](https://github.com/brad-jones/cdkts/compare/ad91f99979d0359e071c0997687735f9fbb052ee..v0.2.3) - 2026-02-05
#### Bug Fixes
- (**bundler**) create the entrypoint alongside the stackfile so that deno compile actually bundles the stackfile - ([ad91f99](https://github.com/brad-jones/cdkts/commit/ad91f99979d0359e071c0997687735f9fbb052ee)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.2](https://github.com/brad-jones/cdkts/compare/9cd9c52cada165d7b9a436a6a7adc978364e5e03..v0.2.2) - 2026-02-05
#### Bug Fixes
- (**bundler**) inject the config of the stackfile at compile time - ([9cd9c52](https://github.com/brad-jones/cdkts/commit/9cd9c52cada165d7b9a436a6a7adc978364e5e03)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.1](https://github.com/brad-jones/cdkts/compare/16c278fa7e3c6c221ca8b462a324b3056a343fd6..v0.2.1) - 2026-02-05
#### Bug Fixes
- (**bundler**) use correct import syntax - ([16c278f](https://github.com/brad-jones/cdkts/commit/16c278fa7e3c6c221ca8b462a324b3056a343fd6)) - [@brad-jones](https://github.com/brad-jones)
- (**cli**) wrapper now injects the deno config file for the stackfile if found - ([de823a8](https://github.com/brad-jones/cdkts/commit/de823a859a9207160dfc501280d5e1bfada664ac)) - [@brad-jones](https://github.com/brad-jones)
#### Style
- new line on deno.json to pass linting - ([d3edf34](https://github.com/brad-jones/cdkts/commit/d3edf3458daa464fb6092e60c08f82d7b4e8f8d8)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.2.0](https://github.com/brad-jones/cdkts/compare/15a079add708d547101caf18a69962601b3f9d26..v0.2.0) - 2026-02-05
#### Features
- (**bundler**) auto generate a main entrypoint as per the example suggests - ([cbb6b42](https://github.com/brad-jones/cdkts/commit/cbb6b42b7d1ae9f786399e57acd8c23b66b9cdab)) - github-actions[bot]
- (**bundler**) now works for the denobridge provider - ([96f396d](https://github.com/brad-jones/cdkts/commit/96f396d4c206adc5369104bc0999c28f2e4e5df4)) - github-actions[bot]
- (**cli**) added clean command, primarily for my debugging needs - ([1f2fbe2](https://github.com/brad-jones/cdkts/commit/1f2fbe28626aa8af1337f62d11c680ecc39b1f37)) - github-actions[bot]
- integrated denobridge - ([771687b](https://github.com/brad-jones/cdkts/commit/771687b10f70693c64085455a74af519cb3b3cef)) - github-actions[bot]
#### Bug Fixes
- (**cli**) clean now removes cdkts-embedded- files - ([158011a](https://github.com/brad-jones/cdkts/commit/158011acca0853a2c9ab018b350dea59df6c797c)) - github-actions[bot]
- correctly implement the outputs proxy - ([7621e3e](https://github.com/brad-jones/cdkts/commit/7621e3e683c9b2b73f3b10ca17c3bf7a8927237c)) - github-actions[bot]
- escape strings for hcl - ([f55c6db](https://github.com/brad-jones/cdkts/commit/f55c6dbbf7a6012181be34ad9d5fc944ffe36a6c)) - github-actions[bot]
#### Documentation
- updates to the examples to show off most recent changes - ([0bbf548](https://github.com/brad-jones/cdkts/commit/0bbf548552c6cc34787a9ea29cc3d258ce2482e0)) - github-actions[bot]
#### Build system
- (**cli**) ensure the bin dir gets created (attempt #2) - ([412156a](https://github.com/brad-jones/cdkts/commit/412156ad3e80c011b640d800c93765cf1af05676)) - github-actions[bot]
- (**cli**) ensure the bin dir gets created - ([be4ae05](https://github.com/brad-jones/cdkts/commit/be4ae05ea43badc22ef2384c5d65eac7822dd44b)) - github-actions[bot]
- (**cli**) added cli wrapper and scripts to build it - ([4c7012b](https://github.com/brad-jones/cdkts/commit/4c7012b5b3a31c2bc75b064d2b64318b5563859b)) - github-actions[bot]
- install a cdkts alias script for local dev - ([15a079a](https://github.com/brad-jones/cdkts/commit/15a079add708d547101caf18a69962601b3f9d26)) - github-actions[bot]
#### Refactoring
- fix up some lint errors and dry up the code a bit - ([35714f2](https://github.com/brad-jones/cdkts/commit/35714f2452ab6ee320928135eee2077677fa27e6)) - github-actions[bot]
#### Miscellaneous Chores
- (**wip**) working on deno bridge provider examples - ([fc78ff0](https://github.com/brad-jones/cdkts/commit/fc78ff0834adfecaa1e711511932011f32b5732e)) - github-actions[bot]
- bump deps - ([5ebb710](https://github.com/brad-jones/cdkts/commit/5ebb7100256fd238dfca0f1a582187fd1822b12b)) - github-actions[bot]
#### Style
- remove unused imports - ([f4bd72c](https://github.com/brad-jones/cdkts/commit/f4bd72c242eeda2400fa8d583f4c72dbdcecefc9)) - github-actions[bot]

- - -

## [v0.1.0](https://github.com/brad-jones/cdkts/compare/d68c193fcdc22306a7d3831157ca1890b997fca6..v0.1.0) - 2026-01-27
#### Features
- initial release - ([bf44e3f](https://github.com/brad-jones/cdkts/commit/bf44e3f56c7876a0573a63afefef26ce38e1206c)) - github-actions[bot]
#### Continuous Integration
- run our tests at package time - ([73f0459](https://github.com/brad-jones/cdkts/commit/73f045966f9d89ef2a7536ac4feb67b9e9d81b9c)) - github-actions[bot]
- allow-slow-types at publish time - ([bce94e1](https://github.com/brad-jones/cdkts/commit/bce94e15f1a3951dda1c02ce99bf0ba70968cb60)) - github-actions[bot]
- make try-cog-bump.ts executable - ([3be2dfe](https://github.com/brad-jones/cdkts/commit/3be2dfefb29baf53df5462c9834a46ab4df5fa6f)) - github-actions[bot]
- fix typo in try-cog-bump.ts file path - ([d129f19](https://github.com/brad-jones/cdkts/commit/d129f19ff42db8e9ef006219643ae320216c3e02)) - github-actions[bot]
- fix typo in workflow file path - ([955d160](https://github.com/brad-jones/cdkts/commit/955d160303f754c255c66e15a49604079cab9269)) - github-actions[bot]
#### Miscellaneous Chores
- (**wip**) progress update - ([24cc7ac](https://github.com/brad-jones/cdkts/commit/24cc7ac9913e90b19a283f62660278517b39ce5a)) - [@brad-jones](https://github.com/brad-jones)
- initial commit - ([d68c193](https://github.com/brad-jones/cdkts/commit/d68c193fcdc22306a7d3831157ca1890b997fca6)) - [@brad-jones](https://github.com/brad-jones)

- - -

Changelog generated by [cocogitto](https://github.com/cocogitto/cocogitto).
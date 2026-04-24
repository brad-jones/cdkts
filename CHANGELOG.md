# Changelog
All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -
## [v0.8.0](https://github.com/brad-jones/cdkts/compare/33852cac0c393204c8fcf327245e3fb713ee5bad..v0.8.0) - 2026-04-24
#### Features
- (**backends**) implement all 9 Terraform backend types with full property coverage - ([5e27312](https://github.com/brad-jones/cdkts/commit/5e273123b007ce3494b6038e7470882c6d386251)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**blocks**) implement Check and Assertion blocks - ([b089aac](https://github.com/brad-jones/cdkts/commit/b089aac0675df6eacb9586d118388f8da741699c)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**cli**) add generate command for terraform provider bindings - ([a82dc1f](https://github.com/brad-jones/cdkts/commit/a82dc1f8647a0b637cc044623b056f6031e26033)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**constructs**) add OpenTofu state encryption support - ([b8bd776](https://github.com/brad-jones/cdkts/commit/b8bd77658c9ea353baaa25f682cb3a0537f5a655)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**constructs**) add connection and provisioner blocks to Resource and Removed - ([49adc84](https://github.com/brad-jones/cdkts/commit/49adc842fafee27ff0fdd9a9ac8db31750b4acac)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**constructs**) implement Removed block construct - ([ed1abb1](https://github.com/brad-jones/cdkts/commit/ed1abb1fd3bdce6510dc0431c6ad219c7d727910)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**constructs**) implement Moved block construct - ([0992c95](https://github.com/brad-jones/cdkts/commit/0992c953aa09e8774847247c841067f26446beb9)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**constructs**) implement Module block construct - ([ed65399](https://github.com/brad-jones/cdkts/commit/ed653997d911f91c9a46a2bc5affc3ee53650ca2)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**constructs**) implement Import block - ([77875c5](https://github.com/brad-jones/cdkts/commit/77875c5cf7bf0e9a348594e0edb0a10dc83182cd)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**generate**) add --build-number option for pre-release JSR versions - ([a18a65e](https://github.com/brad-jones/cdkts/commit/a18a65e7816714579044bd9517f83df5ea78b5bf)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**locals**) implement Local construct - ([89dffe9](https://github.com/brad-jones/cdkts/commit/89dffe95fb4c7b2765974286b351f4e7816334d4)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**terraform**) add provider_meta block support - ([69e3118](https://github.com/brad-jones/cdkts/commit/69e3118d1c077d4e656add058f872f7f5d7fa2c8)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**terraform**) add cloud block support for HCP Terraform - ([6a9d299](https://github.com/brad-jones/cdkts/commit/6a9d299930161cc9ca349ab0bb59b09a3ed09378)) - [@brad-jones](https://github.com/brad-jones), Copilot
- add DenoBackend construct for TypeScript state backends - ([900dda8](https://github.com/brad-jones/cdkts/commit/900dda828e382f0d2000fc18feca86811d75c66e)) - [@brad-jones](https://github.com/brad-jones), Copilot
#### Bug Fixes
- (**assertion**) resolve condition interpolation to raw HCL - ([548fef2](https://github.com/brad-jones/cdkts/commit/548fef231f107e25ad8d212612f4502b35264c1e)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**backends**) add missing properties and S3 multi-role support - ([4785b2f](https://github.com/brad-jones/cdkts/commit/4785b2f24d00356bfb26bc158cd4a85d388fc01c)) - [@brad-jones](https://github.com/brad-jones), Copilot
#### Documentation
- (**TODO**) remove state encryption consideration - ([250b6be](https://github.com/brad-jones/cdkts/commit/250b6bedd4bcffc09f8163b16c0acfecdc9c460d)) - [@brad-jones](https://github.com/brad-jones)
- remove completed terraform block constructs todo - ([8669d16](https://github.com/brad-jones/cdkts/commit/8669d16165acc642c749d9e41d7db47c68088108)) - [@brad-jones](https://github.com/brad-jones), Copilot
- expand API overview descriptions for constructs - ([2c9db46](https://github.com/brad-jones/cdkts/commit/2c9db463d3e727d0155e780a901af238808fcf17)) - [@brad-jones](https://github.com/brad-jones), Copilot
- add TASKS section to AGENTS.md - ([7a10646](https://github.com/brad-jones/cdkts/commit/7a10646debc1e550a8d79e5a871efaa5e13469d7)) - [@brad-jones](https://github.com/brad-jones), Copilot
#### Build system
- (**dprint**) bump plugin versions - ([6bb5471](https://github.com/brad-jones/cdkts/commit/6bb5471d8f981aa121e9f84e30d9eed8f2d4706d)) - [@brad-jones](https://github.com/brad-jones), Copilot
#### Refactoring
- (**deno-backend**) use callback API for Terraform child constructs - ([4479301](https://github.com/brad-jones/cdkts/commit/447930116ce812cf8310439680cfe9505f243f66)) - [@brad-jones](https://github.com/brad-jones), Copilot
- (**import**) replace `Block<any>` with `Provider` type - ([56c46af](https://github.com/brad-jones/cdkts/commit/56c46af2ce8630080b8fa8c8ba4b418eabc86e58)) - [@brad-jones](https://github.com/brad-jones), Copilot
- implement AsyncDisposable for Project and DenoBackendServer - ([483f0ed](https://github.com/brad-jones/cdkts/commit/483f0ed7197b99b0ae99e341912f4a19942f5375)) - [@brad-jones](https://github.com/brad-jones), Copilot
#### Miscellaneous Chores
- remove completed/superseded TODO items - ([fd36266](https://github.com/brad-jones/cdkts/commit/fd36266c980d9d32c1857a9ab48e2ce4ab0a1adb)) - [@brad-jones](https://github.com/brad-jones), Copilot
- add copilot-cli tooling and agent skills - ([33852ca](https://github.com/brad-jones/cdkts/commit/33852cac0c393204c8fcf327245e3fb713ee5bad)) - [@brad-jones](https://github.com/brad-jones), Copilot

- - -

## [v0.7.8](https://github.com/brad-jones/cdkts/compare/857a57b994192648f4295229c710cbb3e92cef15..v0.7.8) - 2026-04-23
#### Miscellaneous Chores
- (**scripts**) execute bit - ([06683c8](https://github.com/brad-jones/cdkts/commit/06683c862476615238bbfd93895de82e71dfaeb5)) - [@brad-jones](https://github.com/brad-jones)
- bump versions - ([6432af6](https://github.com/brad-jones/cdkts/commit/6432af6cd982b442a36d88894257ac0e34a55742)) - [@brad-jones](https://github.com/brad-jones)
- remove some unneeded tasks - ([949d3bc](https://github.com/brad-jones/cdkts/commit/949d3bcda427d013cf12afbf2963f889b24d08ae)) - [@brad-jones](https://github.com/brad-jones)
- add the scripts dir to PATH - ([990a2dd](https://github.com/brad-jones/cdkts/commit/990a2dd25a55cd0b06629249dc7ba412a8d8b720)) - [@brad-jones](https://github.com/brad-jones)
- add lefthook script to ensure scripts are always executable - ([d3fd48b](https://github.com/brad-jones/cdkts/commit/d3fd48b1fb65ffa70d5ab2886e64e78e0f259a8f)) - [@brad-jones](https://github.com/brad-jones)
- connect direnv to task init - ([857a57b](https://github.com/brad-jones/cdkts/commit/857a57b994192648f4295229c710cbb3e92cef15)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.7](https://github.com/brad-jones/cdkts/compare/28d5681185e8887addc53a8f27649da66cec6b85..v0.7.7) - 2026-02-28
#### Miscellaneous Chores
- added a todo list - ([28d5681](https://github.com/brad-jones/cdkts/commit/28d5681185e8887addc53a8f27649da66cec6b85)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.6](https://github.com/brad-jones/cdkts/compare/6955d221b9481af3ac22de27faafe3e5a26478da..v0.7.6) - 2026-02-28
#### Miscellaneous Chores
- (**deno**) bump lock file again - ([f58f999](https://github.com/brad-jones/cdkts/commit/f58f9996a455eb8f2e73244b069d6b8843dc635e)) - [@brad-jones](https://github.com/brad-jones)
- (**deno**) bump versions - ([6955d22](https://github.com/brad-jones/cdkts/commit/6955d221b9481af3ac22de27faafe3e5a26478da)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.5](https://github.com/brad-jones/cdkts/compare/8bc6b415d53366c1c0cb586a373c36641cc89fc0..v0.7.5) - 2026-02-28
#### Miscellaneous Chores
- (**pixi**) bump versions and add direnv support - ([8bc6b41](https://github.com/brad-jones/cdkts/commit/8bc6b415d53366c1c0cb586a373c36641cc89fc0)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.4](https://github.com/brad-jones/cdkts/compare/a16c0835c24f8670d5b268aaffc5beddb8e40f06..v0.7.4) - 2026-02-16
#### Bug Fixes
- (**constructs**) finally figured out the right way to escape ${ to prevent HCL interpolation - ([a16c083](https://github.com/brad-jones/cdkts/commit/a16c0835c24f8670d5b268aaffc5beddb8e40f06)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.3](https://github.com/brad-jones/cdkts/compare/481f0c624e7a8ac4ad641f22f64d6cfe49ebb335..v0.7.3) - 2026-02-15
#### Bug Fixes
- (**constructs**) add default permissions to DenoFormat so it works out of the box - ([481f0c6](https://github.com/brad-jones/cdkts/commit/481f0c624e7a8ac4ad641f22f64d6cfe49ebb335)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.2](https://github.com/brad-jones/cdkts/compare/81bb6a85f823ddc605c5102c945168555f87559c..v0.7.2) - 2026-02-15
#### Bug Fixes
- (**constructs**) the format func just doesn't make sense as we need to capture the logical id of the block and there is no good way to automate that - ([81bb6a8](https://github.com/brad-jones/cdkts/commit/81bb6a85f823ddc605c5102c945168555f87559c)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.1](https://github.com/brad-jones/cdkts/compare/ffccd9b29b1add2a42aff4d4ca9d1cea2891ffe3..v0.7.1) - 2026-02-15
#### Bug Fixes
- (**constructs**) correctly map configFile to config_file - ([ffccd9b](https://github.com/brad-jones/cdkts/commit/ffccd9b29b1add2a42aff4d4ca9d1cea2891ffe3)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.7.0](https://github.com/brad-jones/cdkts/compare/4ca16219db6c4cf01badd8ff255820155e605941..v0.7.0) - 2026-02-15
#### Features
- (**constructs**) automatically inject the stacks deno config file - ([523e06b](https://github.com/brad-jones/cdkts/commit/523e06b6c4c4a38e138f52b8bc0db29205987ffc)) - [@brad-jones](https://github.com/brad-jones)
#### Bug Fixes
- (**constructs**) expose the config file property for deno bridge constructs - ([4ca1621](https://github.com/brad-jones/cdkts/commit/4ca16219db6c4cf01badd8ff255820155e605941)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.7](https://github.com/brad-jones/cdkts/compare/bbf9dc5d250e49733fafa4cf16da1418bcc8c34c..v0.6.7) - 2026-02-15
#### Miscellaneous Chores
- bump @brad-jones/terraform-provider-denobridge (#attempt 2) - ([dcb7b61](https://github.com/brad-jones/cdkts/commit/dcb7b615823eaec395921a6d5e2367e792553f3e)) - [@brad-jones](https://github.com/brad-jones)
- bump @brad-jones/terraform-provider-denobridge - ([bbf9dc5](https://github.com/brad-jones/cdkts/commit/bbf9dc5d250e49733fafa4cf16da1418bcc8c34c)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.6](https://github.com/brad-jones/cdkts/compare/321a3f784693c1f9f948a2f500786a605dc32593..v0.6.6) - 2026-02-15
#### Bug Fixes
- (**constructs**) re-write sensitive and writeOnly props to work with denobridge - ([b8e171c](https://github.com/brad-jones/cdkts/commit/b8e171c16c8fd94da1de133f39907ab29ff7c857)) - [@brad-jones](https://github.com/brad-jones)
- (**constructs**) hcl is now prettier and does not contain unneeded newlines - ([326a8a8](https://github.com/brad-jones/cdkts/commit/326a8a8dfac067821dd856c0d2296fb9a4e6a823)) - [@brad-jones](https://github.com/brad-jones)
#### Build system
- allow command like task test -- --filter xyz to be run - ([321a3f7](https://github.com/brad-jones/cdkts/commit/321a3f784693c1f9f948a2f500786a605dc32593)) - [@brad-jones](https://github.com/brad-jones)
#### Refactoring
- small change that outputs blocks in a more ordered way - ([13c8d59](https://github.com/brad-jones/cdkts/commit/13c8d595e16b4c6a70147574faa80f774a7a19cc)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.5](https://github.com/brad-jones/cdkts/compare/7096884e59ea3470210b128d4d60a43333a376e8..v0.6.5) - 2026-02-14
#### Bug Fixes
- (**constructs**) make the basic 4 block types automatically namespace their labels - ([7096884](https://github.com/brad-jones/cdkts/commit/7096884e59ea3470210b128d4d60a43333a376e8)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.4](https://github.com/brad-jones/cdkts/compare/63fa26241585b2273f0cb7da995ffb07b56ff8ff..v0.6.4) - 2026-02-14
#### Bug Fixes
- (**provider**) add deno_binary_path & deno_version hcl name - ([63fa262](https://github.com/brad-jones/cdkts/commit/63fa26241585b2273f0cb7da995ffb07b56ff8ff)) - [@brad-jones](https://github.com/brad-jones)
#### Tests
- update test to account for the recent snake case changes - ([0ff07c3](https://github.com/brad-jones/cdkts/commit/0ff07c3f181b89cb8a0362b0c2a5bc8c80f6c53a)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.3](https://github.com/brad-jones/cdkts/compare/32dc3aa7ef1e9ec75392f4deb2562be753967a65..v0.6.3) - 2026-02-14
#### Bug Fixes
- (**format**) need to generate an id that works in hcl - ([32dc3aa](https://github.com/brad-jones/cdkts/commit/32dc3aa7ef1e9ec75392f4deb2562be753967a65)) - [@brad-jones](https://github.com/brad-jones)
- (**resource**) add action_triggers hcl name - ([bb92ffa](https://github.com/brad-jones/cdkts/commit/bb92ffa7078f84c935d22c3ece478511b9619fa9)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.2](https://github.com/brad-jones/cdkts/compare/41161fea840774c3ea2a0669388214b4c2920128..v0.6.2) - 2026-02-14
#### Bug Fixes
- (**constructs**) format func handles an async formatter - ([41161fe](https://github.com/brad-jones/cdkts/commit/41161fea840774c3ea2a0669388214b4c2920128)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.1](https://github.com/brad-jones/cdkts/compare/f921bb5b28092a6519b2f2adc30d5c4259463779..v0.6.1) - 2026-02-14
#### Miscellaneous Chores
- bump lock files (attempt #2) - ([919a3ba](https://github.com/brad-jones/cdkts/commit/919a3bade117fb81ab4abbcb8ac86d0260a4a5ad)) - [@brad-jones](https://github.com/brad-jones)
- bump lock files - ([f921bb5](https://github.com/brad-jones/cdkts/commit/f921bb5b28092a6519b2f2adc30d5c4259463779)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.6.0](https://github.com/brad-jones/cdkts/compare/e0abd7e690e7257032a3afcca4468f79fe6cdcb7..v0.6.0) - 2026-02-13
#### Features
- finished automatic denobridge provider registration - ([5115297](https://github.com/brad-jones/cdkts/commit/5115297f0dc0b0d724ecebc505a1549fe8ca4f52)) - [@brad-jones](https://github.com/brad-jones)
- added a format datasource - ([6244041](https://github.com/brad-jones/cdkts/commit/6244041ee2e1c7e8539fca5f00da9bee8db6403f)) - [@brad-jones](https://github.com/brad-jones)
#### Bug Fixes
- (**constructs**) remove implicit snake case transform and introduce hclName metadata for Block Inputs. - ([cf052cc](https://github.com/brad-jones/cdkts/commit/cf052ccdc10de01b1390500d76d57d9d689118aa)) - [@brad-jones](https://github.com/brad-jones)
- (**constructs**) stacks now correctly render blocks from nested constructs - ([d91e3d4](https://github.com/brad-jones/cdkts/commit/d91e3d40829715187f557bab6292e2bcbd1a6420)) - [@brad-jones](https://github.com/brad-jones)
#### Tests
- update to account for dynamic DENOBRIDGE_VERSION - ([007a6f9](https://github.com/brad-jones/cdkts/commit/007a6f904d49238faf844c0109f8601145e5cb13)) - [@brad-jones](https://github.com/brad-jones)
#### Build system
- make sure the new tests folder runs too - ([7eab88f](https://github.com/brad-jones/cdkts/commit/7eab88feb84b96c3a3689add9101f4e27d3e31ef)) - [@brad-jones](https://github.com/brad-jones)
#### Miscellaneous Chores
- (**wip**) added automatic denobridge provider registration - ([ef6e125](https://github.com/brad-jones/cdkts/commit/ef6e125c5acb40cf5cc40053eb1abe51c999759e)) - [@brad-jones](https://github.com/brad-jones)
- bump deno lock file (attempt #2) - ([9822451](https://github.com/brad-jones/cdkts/commit/9822451c29af83828d4b5a46a62b9666584076af)) - [@brad-jones](https://github.com/brad-jones)
- bump deno lock file - ([b068f3d](https://github.com/brad-jones/cdkts/commit/b068f3d5e21166103a6c748f403f0bbf4b8b0853)) - [@brad-jones](https://github.com/brad-jones)
- bump deno deps - ([f50bae6](https://github.com/brad-jones/cdkts/commit/f50bae63dffda9d8ff72f2073e4b72362cdfad04)) - [@brad-jones](https://github.com/brad-jones)
- changed my mind, this test file can live alongside the stack source, will keep the seperate tests folder for end to end tests - ([8b22d03](https://github.com/brad-jones/cdkts/commit/8b22d0307177fa2df4e4ae3840c59097dd562d78)) - [@brad-jones](https://github.com/brad-jones)
- bump pixi lock file - ([e0abd7e](https://github.com/brad-jones/cdkts/commit/e0abd7e690e7257032a3afcca4468f79fe6cdcb7)) - [@brad-jones](https://github.com/brad-jones)
#### Style
- added newline - ([61d1937](https://github.com/brad-jones/cdkts/commit/61d19377f8bce00791b80a3cae1649fbb6304468)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.5.3](https://github.com/brad-jones/cdkts/compare/549079d17228ccc0eee6494d48842bab9778816c..v0.5.3) - 2026-02-11
#### Bug Fixes
- update dependsOn type to Block[] so that the HCL is serialized without quotes - ([549079d](https://github.com/brad-jones/cdkts/commit/549079d17228ccc0eee6494d48842bab9778816c)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.5.2](https://github.com/brad-jones/cdkts/compare/9522726ebab9a9d689b44ad0eca70f3d00c7a0c8..v0.5.2) - 2026-02-10
#### Bug Fixes
- (**escapeHclString**) do not escape the percentage sign - ([9522726](https://github.com/brad-jones/cdkts/commit/9522726ebab9a9d689b44ad0eca70f3d00c7a0c8)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.5.1](https://github.com/brad-jones/cdkts/compare/1871bda34225d9e6a29201c7c2bffa8732b32739..v0.5.1) - 2026-02-10
#### Documentation
- update readme with latest CLI install instructions - ([1871bda](https://github.com/brad-jones/cdkts/commit/1871bda34225d9e6a29201c7c2bffa8732b32739)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.5.0](https://github.com/brad-jones/cdkts/compare/87fb0af6baf1499bfb28c453b0f50d1e5c03e9ee..v0.5.0) - 2026-02-10
#### Features
- go back to the go cli wrapper but without injecting config - ([87fb0af](https://github.com/brad-jones/cdkts/commit/87fb0af6baf1499bfb28c453b0f50d1e5c03e9ee)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.4.1](https://github.com/brad-jones/cdkts/compare/8cbccaf03e0284709e7ad351eabc8b16670dc22d..v0.4.1) - 2026-02-09
#### Miscellaneous Chores
- update deno  lockfile - ([6107d10](https://github.com/brad-jones/cdkts/commit/6107d100a67fae8b4b100fbdb3440e0ff0358ed4)) - [@brad-jones](https://github.com/brad-jones)
- bump deno-ts-importer version - ([8cbccaf](https://github.com/brad-jones/cdkts/commit/8cbccaf03e0284709e7ad351eabc8b16670dc22d)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.4.0](https://github.com/brad-jones/cdkts/compare/4e922060b96fc65de4c8213befe003149b3c0652..v0.4.0) - 2026-02-09
#### Features
- remove go cli wrapper - ([4e92206](https://github.com/brad-jones/cdkts/commit/4e922060b96fc65de4c8213befe003149b3c0652)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.3.5](https://github.com/brad-jones/cdkts/compare/256129db035ecfaa4fbc1d90468af10f6e1fa46b..v0.3.5) - 2026-02-06
#### Bug Fixes
- (**examples**) use RawHcl for direct hcl interpolation - ([256129d](https://github.com/brad-jones/cdkts/commit/256129db035ecfaa4fbc1d90468af10f6e1fa46b)) - [@brad-jones](https://github.com/brad-jones)
#### Refactoring
- swap out @brad-jones/jsr-dynamic-imports for @lambdalisue/import-map-importer - ([3ad8112](https://github.com/brad-jones/cdkts/commit/3ad8112afe6556272280f450a281206031e9567c)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.3.4](https://github.com/brad-jones/cdkts/compare/e33ba887d3e1819a4efea04a962ac21444bf35be..v0.3.4) - 2026-02-06
#### Documentation
- (**readme**) added CLI install instructions for pixi - ([e33ba88](https://github.com/brad-jones/cdkts/commit/e33ba887d3e1819a4efea04a962ac21444bf35be)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.3.3](https://github.com/brad-jones/cdkts/compare/e00fc0bbfd894aca5f6a999e67471e105b48021a..v0.3.3) - 2026-02-06
#### Bug Fixes
- (**cli**) inject version into cliffy - ([e00fc0b](https://github.com/brad-jones/cdkts/commit/e00fc0bbfd894aca5f6a999e67471e105b48021a)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.3.2](https://github.com/brad-jones/cdkts/compare/c45b3030845cd99eccc5786709dfc6899385af9c..v0.3.2) - 2026-02-06
#### Bug Fixes
- (**cli**) logic for default install dir was incorrect, we ended up with bin/bin paths - ([c45b303](https://github.com/brad-jones/cdkts/commit/c45b3030845cd99eccc5786709dfc6899385af9c)) - [@brad-jones](https://github.com/brad-jones)

- - -

## [v0.3.1](https://github.com/brad-jones/cdkts/compare/30c8b8573a015c6b8359d8d7ea8ca8fbf0aca429..v0.3.1) - 2026-02-06
#### Bug Fixes
- (**cli**) need to override the cliffy version option in the installer - ([30c8b85](https://github.com/brad-jones/cdkts/commit/30c8b8573a015c6b8359d8d7ea8ca8fbf0aca429)) - [@brad-jones](https://github.com/brad-jones)
#### Documentation
- (**readme**) added CLI install instructions - ([c693c8b](https://github.com/brad-jones/cdkts/commit/c693c8b6ef48e81a919d6b547fe96495696a71bb)) - [@brad-jones](https://github.com/brad-jones)

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
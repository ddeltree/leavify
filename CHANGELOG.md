# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 0.3.0 (2024-06-26)

### ⚠ BREAKING CHANGES

- update package exports
- make `set()` dyad
- rewrite `parsePath()`

### Features

- add `searchStore()` to look inside the prototype chain ([de951f8](https://github.com/ddeltree/leavify/commit/de951f891937e03ac6d1c12b5d275eed46b58e18))
- ignore circular references in `walkLeaves` ([1b5cf9a](https://github.com/ddeltree/leavify/commit/1b5cf9a0da1ecec405815404604091d65f6908a6))
- include `getSaved()` ([d1e4e02](https://github.com/ddeltree/leavify/commit/d1e4e02e6a1226356efc3aa8065da996b5561e47))
- interpret path hints ([6d04dd9](https://github.com/ddeltree/leavify/commit/6d04dd98f76954ff8fe112af557115b5319b8c54))
- refactor `asOriginal()` to leverage new store logic ([5f0c207](https://github.com/ddeltree/leavify/commit/5f0c20724cf11f9b67f3c7bda0fd40afaf144fa2))
- rewrite `parsePath()` ([73e78c6](https://github.com/ddeltree/leavify/commit/73e78c6c5b3bf92ef7079a5c440273d303c52d0b))
- store changes in the prototype ([#18](https://github.com/ddeltree/leavify/issues/18)) ([d52985d](https://github.com/ddeltree/leavify/commit/d52985d3d693110bb651c9470238a771e0c680d8))

### Bug Fixes

- **deps:** tsd's weird requirement for an index.d.ts file ([31f5c07](https://github.com/ddeltree/leavify/commit/31f5c075eec16244034fef8aa3effc5b60d11742))
- empty indices test case ([6573cec](https://github.com/ddeltree/leavify/commit/6573cec2876e7a2d3e91b794cd7f4faffde9df40))
- **LeafPath:** add workaround for interpolated suggestions ([8394527](https://github.com/ddeltree/leavify/commit/8394527e3d32cb7e0b1fdfbc8b14c1369f95cb96)), closes [#12](https://github.com/ddeltree/leavify/issues/12)
- **LeafPath:** arrays inside objects ([9246802](https://github.com/ddeltree/leavify/commit/9246802d6c23a95f8f9425f1b732eaf40d9edd49))
- **LeafPath:** check circular ref after primitive check and before object check ([9212462](https://github.com/ddeltree/leavify/commit/9212462c72b6ccfb49b541040596eb7df3e9f367))
- **LeafPath:** check readonly arrays ([6051de2](https://github.com/ddeltree/leavify/commit/6051de20217c8b9a0d37441446da8642c62be0c4))
- **LeafPath:** handle `Record` type inside object ([ae6070c](https://github.com/ddeltree/leavify/commit/ae6070ce9f492c3275e8c5040b4aa46597b7b5ef))
- **LeafPath:** handle non `as-const` array in object or object in array ([e8367dd](https://github.com/ddeltree/leavify/commit/e8367dda37ebae411164065026899b0832b8110f))
- **LeafPath:** make `undefined` have no effect on `LeafPath` ([0c1c19b](https://github.com/ddeltree/leavify/commit/0c1c19bf5ea8f93eadc917caad86e75e91aa1365))
- **LeafPath:** mixture of leaf and object values inside an array ([d76eff1](https://github.com/ddeltree/leavify/commit/d76eff10c24cc91edf16dc367266d478b8b0e714))
- remove original entries when proposing back to original values ([a57b7a7](https://github.com/ddeltree/leavify/commit/a57b7a776f9c2ed75b3fd784ba5437c483508f84))
- **types:** prevent ts errors in accessor functions ([e21e453](https://github.com/ddeltree/leavify/commit/e21e4533935a849592ebbcdbadec8be1cdcacac1))
- update `save` function ([5320994](https://github.com/ddeltree/leavify/commit/5320994a8da8f493a27004fee36cc8495f82a289))
- **walkLeaves:** return instead of throwing error on circular reference ([d6b1c35](https://github.com/ddeltree/leavify/commit/d6b1c3518526217edc6192788b32f6b4aaac9ec2))

- make `set()` dyad ([dee1b09](https://github.com/ddeltree/leavify/commit/dee1b094e2fe472c9752172414260186e3f13d04))
- update package exports ([64f1fad](https://github.com/ddeltree/leavify/commit/64f1fad00d8a6ba5cf29031d732c87c0d79b7878))

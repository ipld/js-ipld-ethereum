<a name="4.0.2"></a>
## [4.0.2](https://github.com/ipld/js-ipld-ethereum/compare/v4.0.1...v4.0.2) (2020-07-23)


### Bug Fixes

* **package:** update cids to version 0.8.0 ([cb9538b](https://github.com/ipld/js-ipld-ethereum/commit/cb9538b))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/ipld/js-ipld-ethereum/compare/v4.0.0...v4.0.1) (2020-01-13)


### Bug Fixes

* **package:** update multicodec to version 1.0.0 ([640126a](https://github.com/ipld/js-ipld-ethereum/commit/640126a))
* **package:** update multihashing-async to version 0.8.0 ([dc96913](https://github.com/ipld/js-ipld-ethereum/commit/dc96913))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/ipld/js-ipld-ethereum/compare/v3.0.0...v4.0.0) (2019-05-10)


### Bug Fixes

* **package:** update cids to version 0.7.0 ([962737a](https://github.com/ipld/js-ipld-ethereum/commit/962737a))


### BREAKING CHANGES

* **package:** Returned v1 CIDs now default to base32 encoding

Previous versions returned a base58 encoded string when `toString()`/
`toBaseEncodedString()` was called on a CIDv1. It now returns a base32
encoded string.



<a name="3.0.0"></a>
# [3.0.0](https://github.com/ipld/js-ipld-ethereum/compare/v2.0.3...v3.0.0) (2019-05-08)


### Bug Fixes

* **package:** update cids to version 0.6.0 ([c38363a](https://github.com/ipld/js-ipld-ethereum/commit/c38363a))
* **package:** update multihashing-async to version 0.6.0 ([4eaa791](https://github.com/ipld/js-ipld-ethereum/commit/4eaa791))


### Features

* new IPLD Format API ([dc19aa7](https://github.com/ipld/js-ipld-ethereum/commit/dc19aa7))


### BREAKING CHANGES

* The API is now async/await based

There are numerous changes, the most significant one is that the API
is no longer callback based, but it using async/await.

If you want to access the original JavaScript Ethereum object, it is
now stored in a property called `_ethObj`. So if you e.g. called
`deserialized.hash()`, you now have to call
`deserialized._ethObj.hash()`.

For the full new API please see the [IPLD Formats spec].

[IPLD Formats spec]: https://github.com/ipld/interface-ipld-format



<a name="2.0.3"></a>
## [2.0.3](https://github.com/ipld/js-ipld-ethereum/compare/v2.0.2...v2.0.3) (2019-01-18)


### Bug Fixes

* **package:** update merkle-patricia-tree to version 3.0.0 ([57f19fe](https://github.com/ipld/js-ipld-ethereum/commit/57f19fe))
* browser bundle ([a246af1](https://github.com/ipld/js-ipld-ethereum/commit/a246af1))



<a name="2.0.2"></a>
## [2.0.2](https://github.com/ipld/js-ipld-ethereum/compare/v2.0.1...v2.0.2) (2018-11-07)


### Bug Fixes

* sorting function needs to return an integer ([662d8ec](https://github.com/ipld/js-ipld-ethereum/commit/662d8ec))
* **package:** update ipfs-block to version 0.8.0 ([7013beb](https://github.com/ipld/js-ipld-ethereum/commit/7013beb))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/ipld/js-ipld-ethereum/compare/v2.0.0...v2.0.1) (2018-07-13)


### Bug Fixes

* implement CID options ([#21](https://github.com/ipld/js-ipld-ethereum/issues/21)) ([da25e17](https://github.com/ipld/js-ipld-ethereum/commit/da25e17))


### Features

* add defaultHashAlg ([e767312](https://github.com/ipld/js-ipld-ethereum/commit/e767312))
* add util.cid options ([#17](https://github.com/ipld/js-ipld-ethereum/issues/17)) ([f416b43](https://github.com/ipld/js-ipld-ethereum/commit/f416b43)), closes [ipld/interface-ipld-format#40](https://github.com/ipld/interface-ipld-format/issues/40)



<a name="2.0.0"></a>
# [2.0.0](https://github.com/ipld/js-ipld-ethereum/compare/v1.4.4...v2.0.0) (2018-02-12)


### Bug Fixes

* use binary blobs directly ([e69f539](https://github.com/ipld/js-ipld-ethereum/commit/e69f539))


### BREAKING CHANGES

* Everyone calling the functions of `resolve` need to
pass in the binary data instead of an IPFS block.

So if your input is an IPFS block, the code changes from

    resolver.resolve(block, path, (err, result) => {…}

to

    resolver.resolve(block.data, path, (err, result) => {…}



<a name="1.4.4"></a>
## [1.4.4](https://github.com/ipld/js-ipld-ethereum/compare/v1.4.2...v1.4.4) (2017-11-07)



<a name="1.4.2"></a>
## [1.4.2](https://github.com/ipld/js-ipld-ethereum/compare/v1.4.1...v1.4.2) (2017-08-25)


### Features

* update module: name, ci, packages ([bbaf528](https://github.com/ipld/js-ipld-ethereum/commit/bbaf528))



<a name="1.4.1"></a>
## [1.4.1](https://github.com/ipld/js-ipld-ethereum/compare/v1.4.0...v1.4.1) (2017-07-11)



<a name="1.4.0"></a>
# [1.4.0](https://github.com/ipld/js-ipld-ethereum/compare/v1.3.0...v1.4.0) (2017-07-11)



<a name="1.3.0"></a>
# [1.3.0](https://github.com/ipld/js-ipld-ethereum/compare/v1.2.1...v1.3.0) (2017-07-11)



<a name="1.2.1"></a>
## [1.2.1](https://github.com/ipld/js-ipld-ethereum/compare/v1.2.0...v1.2.1) (2017-07-10)



<a name="1.2.0"></a>
# [1.2.0](https://github.com/ipld/js-ipld-ethereum/compare/v1.1.0...v1.2.0) (2017-07-10)



<a name="1.1.0"></a>
# 1.1.0 (2017-07-10)




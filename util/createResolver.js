'use strict'
const CID = require('cids')
const multicodec = require('multicodec')
const createUtil = require('../util/createUtil')

const createResolver = (codec, EthObjClass, fieldAccess) => {
  const util = createUtil(codec, EthObjClass, fieldAccess)

  /**
   * Resolves a path within a Ethereum block.
   *
   * Returns the value or a link and the partial mising path. This way the
   * IPLD Resolver can fetch the link and continue to resolve.
   *
   * @param {Buffer} binaryBlob - Binary representation of a Ethereum block
   * @param {string} [path='/'] - Path that should be resolved
   * @returns {Object} result - Result of the path it it was resolved successfully
   * @returns {*} result.value - Value the path resolves to
   * @returns {string} result.remainderPath - If the path resolves half-way to a
   *   link, then the `remainderPath` is the part after the link that can be used
   *   for further resolving
   */
  const resolve = (binaryBlob, path) => {
    let node = util.deserialize(binaryBlob)

    const parts = path.split('/').filter((x) => x)
    while (parts.length) {
      const key = parts.shift()
      if (node[key] === undefined) {
        throw new Error(`Object has no property '${key}'`)
      }

      node = node[key]
      if (CID.isCID(node)) {
        return {
          value: node,
          remainderPath: parts.join('/')
        }
      }
    }

    return {
      value: node,
      remainderPath: ''
    }
  }

  const _traverse = function * (node, path) {
    // Traverse only objects and arrays
    if (Buffer.isBuffer(node) || CID.isCID(node) || typeof node === 'string') {
      return
    }
    for (const item of Object.keys(node)) {
      const nextpath = path === undefined ? item : path + '/' + item
      yield nextpath
      yield * _traverse(node[item], nextpath)
    }
  }

  /**
   * Return all available paths of a block.
   *
   * @generator
   * @param {Buffer} binaryBlob - Binary representation of a Bitcoin block
   * @yields {string} - A single path
   */
  const tree = function * (binaryBlob) {
    const node = util.deserialize(binaryBlob)

    yield * _traverse(node)
  }

  return {
    codec: codec,
    defaultHashAlg: multicodec.KECCAK_256,
    resolver: {
      resolve: resolve,
      tree: tree,
    },
    util: util,
    // NOTE vmx 2019-04-17: This is a hack. The modules should export
    // `fieldAccess()` internally instead of passing it into the
    // `createResolver()`. This way we could access it internally without
    // the need to attach it to the resolver. This is needed for
    // `eth-block-list`.
    _fieldAccess: fieldAccess
  }
}

module.exports = createResolver

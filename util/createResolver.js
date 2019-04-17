'use strict'
const CID = require('cids')
const multicodec = require('multicodec')
const createUtil = require('../util/createUtil')

const createResolver = (codec, EthObjClass, fieldAccess) => {
  const util = createUtil(codec, EthObjClass, fieldAccess)

  /*
   * resolve: receives a path and a binary blob and returns the value on path,
   * throw if not possible. `binaryBlob` is CBOR encoded data.
   */
  const resolve = async (binaryBlob, path) => {
    let node = await util.deserialize(binaryBlob)

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

  /*
   * tree: returns a flattened array with paths: values of the project.
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

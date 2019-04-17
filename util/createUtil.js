const CID = require('cids')
const mergeOptions = require('merge-options')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')

const { applyVisibility } = require('../util/visibility')

const DEFAULT_HASH_ALG = multicodec.KECCAK_256

const createUtil = (codec, EthObjClass, fieldAccess) => {
  return {
    deserialize: (serialized) => {
      const deserialized = new EthObjClass(serialized)

      // Make sure we have a nice public API that can be used by an IPLD
      // resolver
      if (typeof fieldAccess === 'function') {
        const { getters, removeEnumerables = [], values = [] } = fieldAccess()
        applyVisibility(deserialized, getters, removeEnumerables, values)
      }

      return deserialized
    },
    serialize: (ethObj) => ethObj.serialize(),
    cid: async (binaryBlob, userOptions) => {
      const defaultOptions = { cidVersion: 1, hashAlg: DEFAULT_HASH_ALG}
      const options = mergeOptions(defaultOptions, userOptions)

      const multihash = await multihashing(binaryBlob, options.hashAlg)
      const codecName = multicodec.print[codec]
      const cid = new CID(options.cidVersion, codecName, multihash)

      return cid
    }
  }
}

module.exports = createUtil

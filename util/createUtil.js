const CID = require('cids')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')

const { applyVisibility } = require('../util/visibility')

const DEFAULT_HASH_ALG = multicodec.KECCAK_256

const createUtil = (codec, EthObjClass, fieldAccess) => {
  return {
    /**
     * Deserialize Ethereum block into the internal representation.
     *
     * @param {Buffer} serialized - Binary representation of a Ethereum block.
     * @returns {Object}
     */
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
    /**
     * Serialize internal representation into a binary Ethereum block.
     *
     * @param {Object} ethObj - Internal representation of a Bitcoin block
     * @returns {Buffer}
     */
    serialize: (ethObj) => ethObj.serialize(),
    /**
     * Calculate the CID of the binary blob.
     *
     * @param {Object} binaryBlob - Encoded IPLD Node
     * @param {Object} [userOptions] - Options to create the CID
     * @param {number} [userOptions.cidVersion=1] - CID version number
     * @param {string} [UserOptions.hashAlg] - Defaults to the defaultHashAlg of the format
     * @returns {Promise.<CID>}
     */
    cid: async (binaryBlob, userOptions) => {
      const defaultOptions = { cidVersion: 1, hashAlg: DEFAULT_HASH_ALG}
      const options = Object.assign(defaultOptions, userOptions)

      const multihash = await multihashing(binaryBlob, options.hashAlg)
      const codecName = multicodec.print[codec]
      const cid = new CID(options.cidVersion, codecName, multihash)

      return cid
    }
  }
}

module.exports = createUtil

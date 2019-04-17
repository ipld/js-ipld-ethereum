const CID = require('cids')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')

const DEFAULT_HASH_ALG = multicodec.KECCAK_256

const createUtil = (codec, deserialize) => {
  return {
    /**
     * Deserialize Ethereum block into the internal representation.
     *
     * @param {Buffer} serialized - Binary representation of a Ethereum block.
     * @returns {Object}
     */
    deserialize,
    /**
     * Serialize internal representation into a binary Ethereum block.
     *
     * @param {Object} deserialized - Internal representation of a Bitcoin block
     * @returns {Buffer}
     */
    serialize: (deserialized) => deserialized._ethObj.serialize(),
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

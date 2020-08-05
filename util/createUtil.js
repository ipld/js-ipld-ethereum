const CID = require('cids')
const multicodec = require('multicodec')
const multihashing = require('multihashing-async')
const { Buffer } = require('buffer')

const DEFAULT_HASH_ALG = multicodec.KECCAK_256

const createUtil = (codec, deserialize) => {
  return {
    /**
     * Deserialize Ethereum block into the internal representation.
     *
     * @param {Uint8Array|Array<Uint8Array>} serialized - Binary representation of a Ethereum block.
     * @returns {Object}
     */
    deserialize: (serialized) => {
      if (Array.isArray(serialized)) {
        if (!Buffer.isBuffer(serialized[0])) {
          serialized = serialized.map(s => Buffer.from(s, s.byteOffset, s.byteLength))
        }
      } else if (!Buffer.isBuffer(serialized)) {
        serialized = Buffer.from(serialized, serialized.byteOffset, serialized.byteLength)
      }

      return deserialize(serialized)
    },
    /**
     * Serialize internal representation into a binary Ethereum block.
     *
     * @param {Object} deserialized - Internal representation of a Bitcoin block
     * @returns {Uint8Array}
     */
    serialize: (deserialized) => Uint8Array.from(deserialized._ethObj.serialize()),
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

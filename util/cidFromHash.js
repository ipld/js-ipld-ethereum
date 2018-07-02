'use strict'

const CID = require('cids')
const multihashes = require('multihashes')

module.exports = cidFromHash

function cidFromHash (codec, rawhash) {
  const multihash = multihashes.encode(rawhash, 'keccak-256')
  const cidVersion = 1
  return new CID(cidVersion, codec, multihash)
}

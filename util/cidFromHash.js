'use strict'
const CID = require('cids')
const multihashes = require('multihashes')

module.exports = cidFromHash

function cidFromHash (codec, hashBuffer) {
  const multihash = multihashes.encode(hashBuffer, 'keccak-256')
  const cid = new CID(1, codec, multihash)
  return cid
}

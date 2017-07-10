'use strict'

const CID = require('cids')
const multihashes = require('multihashes')

module.exports = {
  cidForHash: cidForHash,
  isExternalLink: isExternalLink
}

function cidForHash (codec, rawhash) {
  var multihash = multihashes.encode(rawhash, 'keccak-256')
  return new CID(1, codec, multihash)
}

function isExternalLink (obj) {
  return Boolean(obj['/'])
}

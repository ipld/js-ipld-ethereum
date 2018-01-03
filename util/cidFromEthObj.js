'use strict'
const cidFromHash = require('eth-hash-to-cid')

module.exports = cidFromEthObj

function cidFromEthObj (multicodec, ethObj) {
  const hashBuffer = ethObj.hash()
  const cid = cidFromHash(multicodec, hashBuffer)
  return cid
}

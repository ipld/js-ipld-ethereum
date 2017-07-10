'use strict'
const cidFromHash = require('./cidFromHash')

module.exports = cidFromEthObj

function cidFromEthObj (multicodec, ethObj) {
  const hashBuffer = ethObj.hash()
  const cid = cidFromHash(multicodec, hashBuffer)
  return cid
}

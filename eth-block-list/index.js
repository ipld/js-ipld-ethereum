'use strict'
const RLP = require('rlp')
const multicodec = require('multicodec')
const ipldEthBlock = require('../eth-block')
const createResolver = require('../util/createResolver')

const deserialize = (serialized) => {
  const rawOmmers = RLP.decode(serialized)
  const deserialized = rawOmmers.map((rawBlock) => {
    return ipldEthBlock.util.deserialize(rawBlock)
  })

  deserialized.count = deserialized.length

  return deserialized
}

const ethBlockListResolver = createResolver(
  multicodec.ETH_BLOCK_LIST, deserialize)

ethBlockListResolver.util.serialize = (ethBlockList) => {
  const rawOmmers = ethBlockList.map((ethBlock) => ethBlock._ethObj.raw)
  return RLP.encode(rawOmmers)
}

module.exports = ethBlockListResolver

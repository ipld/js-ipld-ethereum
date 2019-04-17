'use strict'
const RLP = require('rlp')
const EthBlockHead = require('ethereumjs-block/header')
const multicodec = require('multicodec')
const ipldEthBlock = require('../eth-block')
const createResolver = require('../util/createResolver')
const { applyVisibility } = require('../util/visibility')

const fieldAccess = () => {
  const getters = {
    count: function () {
      return this.length
    }
  }

  return {
    getters
  }
}

class EthBlockList {
  constructor (serialized) {
    const rawOmmers = RLP.decode(serialized)
    return rawOmmers.map((rawBlock) => {
      const deserialized = new EthBlockHead(rawBlock)
      const {
        getters,
        removeEnumerables = [],
        values = []
      } = ipldEthBlock._fieldAccess()
      applyVisibility(deserialized, getters, removeEnumerables, values)
      return deserialized
    })
  }
}

const ethBlockListResolver = createResolver(
  multicodec.ETH_BLOCK_LIST, EthBlockList, fieldAccess)

ethBlockListResolver.util.serialize = (ethBlockList) => {
  const rawOmmers = ethBlockList.map((ethBlock) => ethBlock.raw)
  return RLP.encode(rawOmmers)
}

module.exports = ethBlockListResolver

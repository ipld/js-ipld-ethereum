'use strict'
const EthTx = require('ethereumjs-tx')
const createResolver = require('../util/createResolver')
const multicodec = require('multicodec')

const fieldAccess = (ethObj) => {
  const getters = {
    toAddress: function () { return this.to },
    fromAddress: function () { return this.from },
    signature: function () { return [this.v, this.r, this.s] },
    isContractPublish: function () { return this.toCreationAddress() }
  }

  const removeEnumerables = ['from', 'raw', 'serialize', 'to', 'toJSON']

  return {
    getters,
    removeEnumerables
  }
}

module.exports = createResolver(multicodec.ETH_TX, EthTx, fieldAccess)

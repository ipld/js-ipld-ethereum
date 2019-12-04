'use strict'
const EthTx = require('ethereumjs-tx').Transaction
const createResolver = require('../util/createResolver')
const multicodec = require('multicodec')

const deserialize = (serialized) => {
  const ethObj = new EthTx(serialized)

  const deserialized = {
    data: ethObj.data,
    fromAddress: ethObj.from,
    gasLimit: ethObj.gasLimit,
    gasPrice: ethObj.gasPrice,
    isContractPublish: ethObj.toCreationAddress(),
    nonce: ethObj.nonce,
    r: ethObj.r,
    s: ethObj.s,
    signature: [ethObj.v, ethObj.r, ethObj.s],
    toAddress: ethObj.to,
    v: ethObj.v,
    value: ethObj.value,
    _ethObj: ethObj
  }

  Object.defineProperty(deserialized, '_ethObj', { enumerable: false })

  return deserialized
}

module.exports = createResolver(multicodec.ETH_TX, deserialize)

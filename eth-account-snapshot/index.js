'use strict'
const EthAccount = require('ethereumjs-account').default
const multicodec = require('multicodec')
const { Buffer } = require('buffer')

const cidFromHash = require('../util/cidFromHash')
const createResolver = require('../util/createResolver')
const emptyCodeHash = require('../util/emptyCodeHash')

const deserialize = (serialized) => {
  const ethObj = new EthAccount(serialized)

  const deserialized = {
    balance: ethObj.balance,
    code: emptyCodeHash.equals(ethObj.codeHash)
      ? Buffer.alloc(0)
      : cidFromHash(multicodec.RAW, ethObj.codeHash),
    codeHash: ethObj.codeHash,
    isEmpty: ethObj.isEmpty(),
    isContract: ethObj.isContract(),
    nonce: ethObj.nonce,
    stateRoot: ethObj.stateRoot,
    storage: cidFromHash(multicodec.ETH_STORAGE_TRIE, ethObj.stateRoot),
    _ethObj: ethObj
  }

  Object.defineProperty(deserialized, '_ethObj', { enumerable: false })

  return deserialized
}

module.exports = createResolver(multicodec.ETH_ACCOUNT_SNAPSHOT, deserialize)

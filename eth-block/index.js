'use strict'
const EthBlockHeader = require('ethereumjs-block/header')
const multicodec = require('multicodec')
const cidFromHash = require('../util/cidFromHash')
const createResolver = require('../util/createResolver')

const deserialize = (serialized) => {
  const ethObj = new EthBlockHeader(serialized)

  const deserialized = {
    authorAddress: ethObj.coinbase,
    bloom: ethObj.bloom,
    difficulty: ethObj.difficulty,
    extraData: ethObj.extraData,
    gasLimit: ethObj.gasLimit,
    gasUsed: ethObj.gasUsed,
    mixHash: ethObj.mixHash,
    nonce: ethObj.nonce,
    number: ethObj.number,
    ommerHash: ethObj.uncleHash,
    ommers: cidFromHash(multicodec.ETH_BLOCK_LIST, ethObj.uncleHash),
    parent: cidFromHash(multicodec.ETH_BLOCK, ethObj.parentHash),
    parentHash: ethObj.parentHash,
    state: cidFromHash(multicodec.ETH_STATE_TRIE, ethObj.stateRoot),
    stateRoot: ethObj.stateRoot,
    timestamp: ethObj.timestamp,
    transactions: cidFromHash(multicodec.ETH_TX_TRIE, ethObj.transactionsTrie),
    transactionReceipts: cidFromHash(
      multicodec.ETH_TX_RECEIPT_TRIE, ethObj.receiptTrie),
    transactionReceiptTrieRoot: ethObj.receiptTrie,
    transactionTrieRoot: ethObj.transactionsTrie,
    _ethObj: ethObj
  }

  Object.defineProperty(deserialized, '_ethObj', { enumerable: false })

  return deserialized
}

module.exports = createResolver(multicodec.ETH_BLOCK, deserialize)

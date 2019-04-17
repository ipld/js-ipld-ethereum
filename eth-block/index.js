'use strict'
const EthBlockHeader = require('ethereumjs-block/header')
const multicodec = require('multicodec')
const cidFromHash = require('../util/cidFromHash')
const createResolver = require('../util/createResolver')

const fieldAccess = () => {
  const getters = {
    parent: function () {
      return cidFromHash(multicodec.ETH_BLOCK, this.parentHash)
    },
    ommers: function () {
      return cidFromHash(multicodec.ETH_BLOCK_LIST, this.uncleHash)
    },
    transactions: function () {
      return cidFromHash(multicodec.ETH_TX_TRIE, this.transactionsTrie)
    },
    transactionReceipts: function () {
      return cidFromHash(multicodec.ETH_TX_RECEIPT_TRIE, this.receiptTrie)
    },
    state: function () {
      return cidFromHash(multicodec.ETH_STATE_TRIE, this.stateRoot)
    },
    ommerHash: function () { return this.uncleHash },
    transactionTrieRoot: function () { return this.transactionsTrie },
    transactionReceiptTrieRoot: function () { return this.receiptTrie },
    authorAddress: function () { return this.coinbase }
  }

  const removeEnumerables = [
    'coinbase', 'raw', 'receiptTrie', 'serialize', 'toJSON',
    'transactionsTrie', 'uncleHash'
  ]

  return {
    getters,
    removeEnumerables
  }
}

module.exports = createResolver(
  multicodec.ETH_BLOCK, EthBlockHeader, fieldAccess)

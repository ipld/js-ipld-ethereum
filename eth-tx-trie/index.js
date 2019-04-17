'use strict'
const multicodec = require('multicodec')

const ethTxResolver = require('../eth-tx')
const createTrieResolver = require('../util/createTrieResolver')

const ethTxTrieResolver = createTrieResolver(
  multicodec.ETH_TX_TRIE, ethTxResolver)

module.exports = ethTxTrieResolver

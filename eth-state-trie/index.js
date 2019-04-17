'use strict'
const multicodec = require('multicodec')

const ethAccountSnapshotResolver = require('../eth-account-snapshot')
const createTrieResolver = require('../util/createTrieResolver')

const ethStateTrieResolver = createTrieResolver(
  multicodec.ETH_STATE_TRIE, ethAccountSnapshotResolver)

module.exports = ethStateTrieResolver

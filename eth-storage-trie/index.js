'use strict'
const multicodec = require('multicodec')

const createTrieResolver = require('../util/createTrieResolver')

const ethStorageTrieResolver = createTrieResolver(multicodec.ETH_STORAGE_TRIE)

module.exports = ethStorageTrieResolver

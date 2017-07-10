'use strict'
/* eslint max-nested-callbacks: ["error", 5] */

const util = require('ipld-eth-trie/src/util.js')
const resolver = require('ipld-eth-trie/src/resolver.js')

const trieIpldFormat = 'eth-storage-trie'

exports.util = {
  deserialize: util.deserialize,
  serialize: util.serialize,
  cid: util.cid.bind(null, trieIpldFormat)
}

exports.resolver = {
  multicodec: trieIpldFormat,
  tree: tree,
  resolve: resolve,
  isLink: isLink
}

function resolve (block, path, callback) {
  resolver.resolve(trieIpldFormat, block, path, (err, result) => {
    if (err) return callback(err)
    return callback(null, result)
  })
}

function tree (block, options, callback) {
  // parse arguments
  if (typeof options === 'function') {
    callback = options
    options = {}
  }
  exports.util.deserialize(block.data, (err, trieNode) => {
    if (err) return callback(err)
    resolver.treeFromObject(trieIpldFormat, trieNode, options, (err, result) => {
      if (err) return callback(err)
      callback(null, result)
    })
  })
}

function isLink (block, path, callback) {
  resolve(block, path, (err, result) => {
    if (err) {
      return callback(err)
    }

    if (result.remainderPath.length > 0) {
      return callback(new Error('path out of scope'))
    }

    if (typeof result.value === 'object' && result.value['/']) {
      callback(null, result.value)
    } else {
      callback(null, false)
    }
  })
}

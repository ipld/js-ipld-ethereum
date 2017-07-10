'use strict'

const rlp = require('rlp')
const TrieNode = require('merkle-patricia-tree/trieNode')
const cidForHash = require('./common').cidForHash

exports.deserialize = function (data, callback) {
  let deserialized
  try {
    let rawNode = rlp.decode(data)
    deserialized = new TrieNode(rawNode)
  } catch (err) {
    return callback(err)
  }
  callback(null, deserialized)
}

exports.serialize = function (trieNode, callback) {
  let serialized
  try {
    serialized = trieNode.serialize()
  } catch (err) {
    return callback(err)
  }
  callback(null, serialized)
}

exports.cid = function (trieIpldFormat, tx, callback) {
  let cid
  try {
    cid = cidForHash(trieIpldFormat, tx.hash())
  } catch (err) {
    return callback(err)
  }
  callback(null, cid)
}

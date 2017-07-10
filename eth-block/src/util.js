'use strict'

const EthBlockHeader = require('ethereumjs-block/header')
const cidForHash = require('./common').cidForHash

exports.deserialize = function (data, callback) {
  let deserialized
  try {
    deserialized = new EthBlockHeader(data)
  } catch (err) {
    return callback(err)
  }
  callback(null, deserialized)
}

exports.serialize = function (blockHeader, callback) {
  let serialized
  try {
    serialized = blockHeader.serialize()
  } catch (err) {
    return callback(err)
  }
  callback(null, serialized)
}

exports.cid = function (blockHeader, callback) {
  let cid
  try {
    cid = cidForHash('eth-block', blockHeader.hash())
  } catch (err) {
    return callback(err)
  }
  callback(null, cid)
}

'use strict'

const Transaction = require('ethereumjs-tx')
const cidForHash = require('./common').cidForHash

exports.deserialize = function (data, callback) {
  let deserialized
  try {
    deserialized = new Transaction(data)
  } catch (err) {
    return callback(err)
  }
  callback(null, deserialized)
}

exports.serialize = function (tx, callback) {
  let serialized
  try {
    serialized = tx.serialize()
  } catch (err) {
    return callback(err)
  }
  callback(null, serialized)
}

exports.cid = function (tx, callback) {
  let cid
  try {
    cid = cidForHash('eth-tx', tx.hash())
  } catch (err) {
    return callback(err)
  }
  callback(null, cid)
}

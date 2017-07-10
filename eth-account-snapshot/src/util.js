'use strict'

const Account = require('ethereumjs-account')
const cidForHash = require('./common').cidForHash

exports.deserialize = function (data, callback) {
  let deserialized
  try {
    deserialized = new Account(data)
  } catch (err) {
    return callback(err)
  }
  callback(null, deserialized)
}

exports.serialize = function (account, callback) {
  let serialized
  try {
    serialized = account.serialize()
  } catch (err) {
    return callback(err)
  }
  callback(null, serialized)
}

exports.cid = function (account, callback) {
  let cid
  try {
    cid = cidForHash('eth-account-snapshot', account.hash())
  } catch (err) {
    return callback(err)
  }
  callback(null, cid)
}

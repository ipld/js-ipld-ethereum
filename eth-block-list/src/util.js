'use strict'

const async = require('async')
const RLP = require('rlp')
const multihash = require('multihashing-async')
const cidForHash = require('./common').cidForHash

exports.deserialize = function (data, callback) {
  let deserialized
  try {
    deserialized = RLP.decode(data)
  } catch (err) {
    return callback(err)
  }
  callback(null, deserialized)
}

exports.serialize = function (blockList, callback) {
  let serialized
  try {
    serialized = RLP.encode(blockList)
  } catch (err) {
    return callback(err)
  }
  callback(null, serialized)
}

exports.cid = function (blockList, callback) {
  async.waterfall([
    (cb) => exports.serialize(blockList, cb),
    (data, cb) => multihash.digest(data, 'keccak-256', cb),
    (mhash, cb) => {
      let cid
      try {
        cid = cidForHash('eth-block-list', mhash)
      } catch (err) {
        return cb(err)
      }
      cb(null, cid)
    },
  ], callback)
}

'use strict'
/* eslint max-nested-callbacks: ["error", 5] */

const each = require('async/each')
const waterfall = require('async/waterfall')
const util = require('ipld-eth-trie/src/util.js')
const resolver = require('ipld-eth-trie/src/resolver.js')
const isExternalLink = require('ipld-eth-trie/src/common').isExternalLink
const IpldEthAccountSnapshotResolver = require('ipld-eth-account-snapshot').resolver
const IpfsBlock = require('ipfs-block')
const CID = require('cids')
const multihashing = require('multihashing-async')

const trieIpldFormat = 'eth-state-trie'

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
  waterfall([
    (cb) => resolver.resolve(trieIpldFormat, block, path, cb),
    (result, cb) => {
      if (isExternalLink(result.value) || result.remainderPath.length === 0) {
        return cb(null, result)
      }

      // continue to resolve on node
      toIpfsBlock(result.value, (err, block) => {
        if (err) {
          return cb(err)
        }
        IpldEthAccountSnapshotResolver.resolve(block, result.remainderPath, cb)
      })
    }
  ], callback)
}

function tree (block, options, callback) {
  exports.util.deserialize(block.data, (err, trieNode) => {
    if (err) {
      return callback(err)
    }

    // leaf node
    if (trieNode.type === 'leaf') {
      return waterfall([
        (cb) => toIpfsBlock(trieNode.getValue(), cb),
        (block, cb) => IpldEthAccountSnapshotResolver.tree(block, options, cb)
      ], callback)
    }

    // non-leaf node
    waterfall([
      (cb) => resolver.treeFromObject(trieIpldFormat, trieNode, options, cb),
      (result, cb) => {
        let paths = []
        each(result, (child, next) => {
          if (!Buffer.isBuffer(child.value)) {
            // node is non-leaf - add as is
            paths.push(child)
            return next()
          }

          // node is leaf - continue to tree
          let key = child.key
          waterfall([
            (cb) => toIpfsBlock(child.value, cb),
            (block, cb) => IpldEthAccountSnapshotResolver.tree(block, options, cb),
            (subpaths, cb) => {
              paths = paths.concat(subpaths.map((p) => {
                p.path = key + '/' + p.path
              }))
              cb()
            }
          ], next)
        }, (err) => {
          if (err) {
            return cb(err)
          }
          cb(null, paths)
        })
      }
    ], callback)
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

function toIpfsBlock (value, callback) {
  multihashing(value, 'keccak-256', (err, hash) => {
    if (err) {
      return callback(err)
    }
    const cid = new CID(1, IpldEthAccountSnapshotResolver.multicodec, hash)
    callback(null, new IpfsBlock(value, cid))
  })
}

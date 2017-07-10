'use strict'
const each = require('async/each')
const waterfall = require('async/waterfall')
const asyncify = require('async/asyncify')
const rlp = require('rlp')
const EthTrieNode = require('merkle-patricia-tree/trieNode')
const trieResolver = require('./base-trie/resolver.js')
const isExternalLink = require('./isExternalLink')
const toIpfsBlock = require('./toIpfsBlock')
const createUtil = require('./createUtil')
const createIsLink = require('./createIsLink')
const cidFromEthObj = require('./cidFromEthObj')


module.exports = createTrieResolver

function createTrieResolver(multicodec, leafResolver){
  const util = createUtil(multicodec, EthTrieNode)
  util.deserialize = asyncify((serialized) => {
    const rawNode = rlp.decode(serialized)
    const trieNode = new EthTrieNode(rawNode)
    return trieNode
  })

  const resolver = {
    multicodec: multicodec,
    resolve: resolve,
    tree: tree,
    isLink: createIsLink(resolve)
  }

  return {
    resolver: resolver,
    util: util,
  }


  function resolve (block, path, callback) {
    waterfall([
      (cb) => trieResolver.resolve(multicodec, block, path, cb),
      (result, cb) => {
        if (isExternalLink(result.value) || result.remainderPath.length === 0) {
          return cb(null, result)
        }

        if (!leafResolver) {
          return cb(null, result)
        }

        // continue to resolve on leaf node
        toIpfsBlock(multicodec, result.value, (err, block) => {
          if (err) {
            return cb(err)
          }
          leafResolver.resolve(block, result.remainderPath, cb)
        })
      }
    ], callback)
  }

  function tree (block, options, callback) {
    util.deserialize(block.data, (err, trieNode) => {
      if (err) {
        return callback(err)
      }

      // leaf node
      if (leafResolver && trieNode.type === 'leaf') {
        return waterfall([
          (cb) => toIpfsBlock(multicodec, trieNode.getValue(), cb),
          (block, cb) => leafResolver.tree(block, options, cb)
        ], callback)
      }

      // non-leaf node
      waterfall([
        (cb) => trieResolver.treeFromObject(multicodec, trieNode, options, cb),
        (result, cb) => {
          let paths = []
          each(result, (child, next) => {
            if (!Buffer.isBuffer(child.value) || !leafResolver) {
              // node is non-leaf - add as is
              paths.push(child)
              return next()
            }

            // node is leaf - continue to tree
            let key = child.key
            waterfall([
              (cb) => toIpfsBlock(multicodec, child.value, cb),
              (block, cb) => leafResolver.tree(block, options, cb),
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
}
'use strict'
const waterfall = require('async/waterfall')
const createIsLink = require('../util/createIsLink')
const createUtil = require('../util/createUtil')

module.exports = createResolver

function createResolver (multicodec, EthObjClass, mapFromEthObject) {
  const util = createUtil(multicodec, EthObjClass)
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

  /*
   * tree: returns a flattened array with paths: values of the project. options
   * are option (i.e. nestness)
   */

  function tree (ipfsBlock, options, callback) {
    // parse arguments
    if (typeof options === 'function') {
      callback = options
      options = undefined
    }
    if (!options) {
      options = {}
    }

    waterfall([
      (cb) => util.deserialize(ipfsBlock.data, cb),
      (ethObj, cb) => treeFromEthObject(ethObj, options, cb)
    ], callback)
  }

  function treeFromEthObject (ethObj, options, callback) {
    waterfall([
      (cb) => mapFromEthObject(ethObj, options, cb),
      (tuples, cb) => cb(null, tuples.map((tuple) => tuple.path))
    ], callback)
  }

  /*
   * resolve: receives a path and a ipfsBlock and returns the value on path,
   * throw if not possible. `ipfsBlock` is an IPFS Block instance (contains data + key)
   */

  function resolve (ipfsBlock, path, callback) {
    waterfall([
      (cb) => util.deserialize(ipfsBlock.data, cb),
      (ethObj, cb) => resolveFromEthObject(ethObj, path, cb)
    ], callback)
  }

  function resolveFromEthObject (ethObj, path, callback) {
    // root
    if (!path || path === '/') {
      const result = { value: ethObj, remainderPath: '' }
      return callback(null, result)
    }

    // parse path
    const pathParts = path.split('/')
    const firstPart = pathParts.shift()
    const remainderPath = pathParts.join('/')

    // check tree results
    mapFromEthObject(ethObj, {}, (err, paths) => {
      if (err) return callback(err)

      const treeResult = paths.find(child => child.path === firstPart)
      if (!treeResult) {
        const err = new Error('Path not found ("' + firstPart + '").')
        return callback(err)
      }

      const result = {
        value: treeResult.value,
        remainderPath: remainderPath
      }
      return callback(null, result)
    })
  }
}
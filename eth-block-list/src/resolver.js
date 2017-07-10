'use strict'

const async = require('async')
const EthBlockHead = require('ethereumjs-block/header')
const IpldEthBlock = require('ipld-eth-block')
const util = require('./util')
const cidForHash = require('./common').cidForHash


exports = module.exports

exports.multicodec = 'eth-block-list'

/*
 * resolve: receives a path and a block and returns the value on path,
 * throw if not possible. `block` is an IPFS Block instance (contains data + key)
 */
exports.resolve = (block, path, callback) => {
  util.deserialize(block.data, (err, ethBlockList) => {
    if (err) return callback(err)
    exports.resolveFromObject(ethBlockList, path, callback)
  })
}

exports.resolveFromObject = (ethBlockList, path, callback) => {
  let result
  
  // root
  if (!path || path === '/') {
    result = { value: ethBlockList, remainderPath: '' }
    return callback(null, result)
  }

  // check tree results
  exports.treeFromObject(ethBlockList, {}, (err, paths) => {
    if (err) return callback(err)

    // find potential matches
    let matches = paths.filter(child => child.path === path.slice(0,child.path.length))
    // take longest match
    let sortedMatches = matches.sort((a,b) => a.path.length < b.path.length)
    let treeResult = sortedMatches[0]

    if (!treeResult) {
      let err = new Error('Path not found ("' + path + '").')
      return callback(err)
    }

    let remainderPath = path.slice(treeResult.path.length)

    result = {
      value: treeResult.value,
      remainderPath: remainderPath
    }
    return callback(null, result)
  })
}

/*
 * tree: returns a flattened array with paths: values of the project. options
 * are option (i.e. nestness)
 */

exports.tree = (block, options, callback) => {
  // parse arguments
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }
  if (!options) {
    options = {}
  }

  util.deserialize(block.data, (err, ethBlockList) => {
    if (err) return callback(err)
    exports.treeFromObject(ethBlockList, options, callback)
  })
}

exports.treeFromObject = (ethBlockList, options, callback) => {
  let paths = []

  // external links (none)

  // external links as data (none)

  // helpers

  paths.push({
    path: 'count',
    value: ethBlockList.length
  })

  // internal data

  // add paths for each block
  async.each(ethBlockList, (rawBlock, next) => {
    let index = ethBlockList.indexOf(rawBlock)
    let blockPath = index.toString()
    let ethBlock = new EthBlockHead(rawBlock)
    // block root
    paths.push({
      path: blockPath,
      value: ethBlock
    })
    // block children
    IpldEthBlock.resolver.treeFromObject(ethBlock, {}, (err, subpaths) => {
      if (err) return next(err)
      // append blockPath to each subpath
      subpaths.forEach((path) => path.path = blockPath + '/' + path.path)
      paths = paths.concat(subpaths)
      next()
    })
  }, (err) => {
    if (err) return callback(err)
    callback(null, paths)
  })
}

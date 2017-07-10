'use strict'

const each = require('async/each')
const asyncify = require('async/asyncify')
const rlp = require('rlp')
const EthTrieNode = require('merkle-patricia-tree/trieNode')
const cidFromHash = require('../cidFromHash')
const createUtil = require('../createUtil')

/*
 * resolve: receives a path and a ipfsBlock and returns the value on path,
 * throw if not possible. `ipfsBlock` is an IPFS Block instance (contains data + key)
 */

exports.resolve = (multicodec, ipfsBlock, path, callback) => {
  const util = createUtil(multicodec, EthTrieNode)
  util.deserialize = asyncify((serialized) => {
    const rawNode = rlp.decode(serialized)
    const trieNode = new EthTrieNode(rawNode)
    return trieNode
  })

  util.deserialize(ipfsBlock.data, (err, ethTrieNode) => {
    if (err) return callback(err)
    exports.resolveFromObject(multicodec, ethTrieNode, path, callback)
  })
}

exports.resolveFromObject = (multicodec, ethTrieNode, path, callback) => {
  let result

  // root
  if (!path || path === '/') {
    result = { value: ethTrieNode, remainderPath: '' }
    return callback(null, result)
  }

  if (ethTrieNode.type === 'leaf') {
    // leaf nodes resolve to their actual value
    result = {
      value: ethTrieNode.getValue(),
      remainderPath: guessRemainingPath(path)
    }
    return callback(null, result)
  }

  // check tree results
  exports.treeFromObject(multicodec, ethTrieNode, {}, (err, paths) => {
    if (err) return callback(err)

    // find potential matches
    let matches = paths.filter(child => child.path === path.slice(0, child.path.length))
    // take longest match
    let sortedMatches = matches.sort((a, b) => a.path.length < b.path.length)
    let treeResult = sortedMatches[0]

    if (!treeResult) {
      let err = new Error('Path not found ("' + path + '").')
      return callback(err)
    }

    // check for leaf node
    let node = treeResult.value
    let value, remainderPath
    if (node.type === 'leaf') {
      // leaf nodes resolve to their actual value
      value = node.getValue()
      remainderPath = guessRemainingPath(path)
    } else {
      value = node
      remainderPath = path.slice(treeResult.path.length)
    }

    // cut off extra slash
    if (remainderPath[0] === '/') {
      remainderPath = remainderPath.slice(1)
    }

    result = {
      value: value,
      remainderPath: remainderPath
    }
    return callback(null, result)
  })
}

/*
 * tree: returns a flattened array with paths: values of the project. options
 * are option (i.e. nestness)
 */

exports.tree = (multicodec, ipfsBlock, options, callback) => {
  // parse arguments
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }
  if (!options) {
    options = {}
  }

  util.deserialize(ipfsBlock.data, (err, trieNode) => {
    if (err) return callback(err)
    exports.treeFromObject(multicodec, trieNode, options, callback)
  })
}

exports.isLink = (ipfsBlock, path, callback) => {
  exports.resolve(ipfsBlock, path, (err, result) => {
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

// util

exports.treeFromObject = (multicodec, trieNode, options, callback) => {
  let paths = []

  each(trieNode.getChildren(), (childData, next) => {
    let key = nibbleToPath(childData[0])
    let value = childData[1]
    if (EthTrieNode.isRawNode(value)) {
      // inline child root
      let childNode = new EthTrieNode(value)
      paths.push({
        path: key,
        value: childNode
      })
      // inline child non-leaf subpaths
      exports.treeFromObject(multicodec, childNode, options, (err, subtree) => {
        if (err) return next(err)
        subtree.forEach((path) => {
          path.path = key + '/' + path.path
        })
        paths = paths.concat(subtree)
        next()
      })
    } else {
      // other nodes link by hash
      let link = { '/': cidFromHash(multicodec, value).toBaseEncodedString() }
      paths.push({
        path: key,
        value: link
      })
      next()
    }
  }, (err) => {
    if (err) return callback(err)
    callback(null, paths)
  })
}

function nibbleToPath (data) {
  return data.map((num) => num.toString(16)).join('/')
}

// we dont know how far we've come
// we dont know how far we have left
// the only thing we can do
// is make an educated guess
function guessRemainingPath (path) {
  let pathParts = path.split('/')
  let triePathLength = guessPathEndFromParts(pathParts) + 1
  let remainderPath = pathParts.slice(triePathLength).join('/')
  return remainderPath
}

function guessPathEndFromParts (pathParts) {
  // find a path part that is not a valid half-byte
  let matchingPart = pathParts.find((part) => part.length > 1 || Number.isNaN(parseInt(part, 16)))
  if (!matchingPart) return pathParts.length - 1
  // use (index - 1) of matching part
  return pathParts.indexOf(matchingPart) - 1
}

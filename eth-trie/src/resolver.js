'use strict'

const async = require('async')
const TrieNode = require('merkle-patricia-tree/trieNode')
const util = require('./util')
const cidForHash = require('./common').cidForHash

/*
 * resolve: receives a path and a block and returns the value on path,
 * throw if not possible. `block` is an IPFS Block instance (contains data + key)
 */

exports.resolve = (trieIpldFormat, block, path, callback) => {
  util.deserialize(block.data, (err, ethTrieNode) => {
    if (err) return callback(err)
    exports.resolveFromObject(trieIpldFormat, ethTrieNode, path, callback)
  })
}

exports.resolveFromObject = (trieIpldFormat, ethTrieNode, path, callback) => {
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
  exports.treeFromObject(trieIpldFormat, ethTrieNode, {}, (err, paths) => {
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

exports.tree = (trieIpldFormat, block, options, callback) => {
  // parse arguments
  if (typeof options === 'function') {
    callback = options
    options = undefined
  }
  if (!options) {
    options = {}
  }

  util.deserialize(block.data, (err, trieNode) => {
    if (err) return callback(err)
    exports.treeFromObject(trieIpldFormat, trieNode, options, callback)
  })
}

exports.isLink = (block, path, callback) => {
  exports.resolve(block, path, (err, result) => {
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

exports.treeFromObject = (trieIpldFormat, trieNode, options, callback) => {
  let paths = []

  async.each(trieNode.getChildren(), (childData, next) => {
    let key = nibbleToPath(childData[0])
    let value = childData[1]
    if (TrieNode.isRawNode(value)) {
      // inline child root
      let childNode = new TrieNode(value)
      paths.push({
        path: key,
        value: childNode
      })
      // inline child non-leaf subpaths
      exports.treeFromObject(trieIpldFormat, childNode, options, (err, subtree) => {
        if (err) return next(err)
        subtree.forEach((path) => {
          path.path = key + '/' + path.path
        })
        paths = paths.concat(subtree)
        next()
      })
    } else {
      // other nodes link by hash
      let link = { '/': cidForHash(trieIpldFormat, value).toBaseEncodedString() }
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

'use strict'

const util = require('./util')
const cidForHash = require('./common').cidForHash

exports = module.exports

exports.multicodec = 'eth-block'

/*
 * resolve: receives a path and a block and returns the value on path,
 * throw if not possible. `block` is an IPFS Block instance (contains data + key)
 */
exports.resolve = (block, path, callback) => {
  util.deserialize(block.data, (err, ethBlock) => {
    if (err) return callback(err)
    exports.resolveFromObject(ethBlock, path, callback)
  })
}

exports.resolveFromObject = (ethBlock, path, callback) => {
  let result

  // root
  if (!path || path === '/') {
    result = { value: ethBlock, remainderPath: '' }
    return callback(null, result)
  }

  // check tree results
  let pathParts = path.split('/')
  let firstPart = pathParts.shift()
  let remainderPath = pathParts.join('/')

  exports.treeFromObject(ethBlock, {}, (err, paths) => {
    if (err) return callback(err)
    let treeResult = paths.find(child => child.path === firstPart)
    if (!treeResult) {
      let err = new Error('Path not found ("' + firstPart + '").')
      return callback(err)
    }

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

  util.deserialize(block.data, (err, ethBlock) => {
    if (err) return callback(err)
    exports.treeFromObject(ethBlock, options, callback)
  })
}

exports.treeFromObject = (ethBlock, options, callback) => {
  const paths = []

  // external links
  paths.push({
    path: 'parent',
    value: { '/': cidForHash('eth-block', ethBlock.parentHash).toBaseEncodedString() }
  })
  paths.push({
    path: 'ommers',
    value: { '/': cidForHash('eth-block-list', ethBlock.uncleHash).toBaseEncodedString() }
  })
  paths.push({
    path: 'transactions',
    value: { '/': cidForHash('eth-tx-trie', ethBlock.transactionsTrie).toBaseEncodedString() }
  })
  paths.push({
    path: 'transactionReceipts',
    value: { '/': cidForHash('eth-tx-receipt-trie', ethBlock.receiptTrie).toBaseEncodedString() }
  })
  paths.push({
    path: 'state',
    value: { '/': cidForHash('eth-state-trie', ethBlock.stateRoot).toBaseEncodedString() }
  })

  // external links as data
  paths.push({
    path: 'parentHash',
    value: ethBlock.parentHash
  })
  paths.push({
    path: 'ommerHash',
    value: ethBlock.uncleHash
  })
  paths.push({
    path: 'transactionTrieRoot',
    value: ethBlock.transactionsTrie
  })
  paths.push({
    path: 'transactionReceiptTrieRoot',
    value: ethBlock.receiptTrie
  })
  paths.push({
    path: 'stateRoot',
    value: ethBlock.stateRoot
  })

  // internal data
  paths.push({
    path: 'authorAddress',
    value: ethBlock.coinbase
  })
  paths.push({
    path: 'bloom',
    value: ethBlock.bloom
  })
  paths.push({
    path: 'difficulty',
    value: ethBlock.difficulty
  })
  paths.push({
    path: 'number',
    value: ethBlock.number
  })
  paths.push({
    path: 'gasLimit',
    value: ethBlock.gasLimit
  })
  paths.push({
    path: 'gasUsed',
    value: ethBlock.gasUsed
  })
  paths.push({
    path: 'timestamp',
    value: ethBlock.timestamp
  })
  paths.push({
    path: 'extraData',
    value: ethBlock.extraData
  })
  paths.push({
    path: 'mixHash',
    value: ethBlock.mixHash
  })
  paths.push({
    path: 'nonce',
    value: ethBlock.nonce
  })

  callback(null, paths)
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

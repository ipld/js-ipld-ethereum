'use strict'

const util = require('./util')

exports = module.exports

exports.multicodec = 'eth-tx'

/*
 * resolve: receives a path and a block and returns the value on path,
 * throw if not possible. `block` is an IPFS Block instance (contains data + key)
 */
exports.resolve = (block, path, callback) => {
  let result
  util.deserialize(block.data, (err, node) => {
    if (err) return callback(err)

    // root
    if (!path || path === '/') {
      result = { value: node, remainderPath: '' }
      return callback(null, result)
    }

    // check tree results
    let pathParts = path.split('/')
    let firstPart = pathParts.shift()
    let remainderPath = pathParts.join('/')

    exports.tree(block, (err, paths) => {
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

  util.deserialize(block.data, (err, tx) => {
    if (err) return callback(err)

    const paths = []

    // external links (none)

    // external links as data (none)

    // internal data

    paths.push({
      path: 'nonce',
      value: tx.nonce
    })
    paths.push({
      path: 'gasPrice',
      value: tx.gasPrice
    })
    paths.push({
      path: 'gasLimit',
      value: tx.gasLimit
    })
    paths.push({
      path: 'toAddress',
      value: tx.to
    })
    paths.push({
      path: 'value',
      value: tx.value
    })
    paths.push({
      path: 'data',
      value: tx.data
    })
    paths.push({
      path: 'v',
      value: tx.v
    })
    paths.push({
      path: 'r',
      value: tx.r
    })
    paths.push({
      path: 's',
      value: tx.s
    })

    // helpers

    paths.push({
      path: 'fromAddress',
      value: tx.from
    })

    paths.push({
      path: 'signature',
      value: [tx.v, tx.r, tx.s]
    })

    paths.push({
      path: 'isContractPublish',
      value: tx.toCreationAddress()
    })

    callback(null, paths)
  })
}

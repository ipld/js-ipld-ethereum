'use strict'

const util = require('./util')

exports = module.exports

exports.multicodec = 'eth-account-snapshot'

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

  util.deserialize(block.data, (err, account) => {
    if (err) return callback(err)

    const paths = []

    // external links

    // paths.push({
    //   path: 'storage',
    //   value: account.stateRoot
    // })

    // paths.push({
    //   path: 'code',
    //   value: account.codeHash
    // })

    // external links as data

    paths.push({
      path: 'stateRoot',
      value: account.stateRoot
    })

    paths.push({
      path: 'codeHash',
      value: account.codeHash
    })

    // internal data

    paths.push({
      path: 'nonce',
      value: account.nonce
    })

    paths.push({
      path: 'balance',
      value: account.balance
    })

    // helpers

    paths.push({
      path: 'isEmpty',
      value: account.isEmpty()
    })

    paths.push({
      path: 'isContract',
      value: account.isContract()
    })

    callback(null, paths)
  })
}

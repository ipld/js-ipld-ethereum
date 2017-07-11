'use strict'
const EthAccount = require('ethereumjs-account')
const createResolver = require('../util/createResolver')
const cidFromHash = require('../util/cidFromHash')

module.exports = createResolver('eth-account-snapshot', EthAccount, mapFromEthObj)


function mapFromEthObj (account, options, callback) {
  const paths = []

  // external links

  paths.push({
    path: 'storage',
    value: { '/': cidFromHash('eth-storage-trie', account.stateRoot).toBaseEncodedString() }
  })

  paths.push({
    path: 'code',
    value: { '/': cidFromHash('raw', account.codeHash).toBaseEncodedString() }
  })

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
}

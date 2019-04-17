'use strict'
const EthAccount = require('ethereumjs-account')
const multicodec = require('multicodec')

const cidFromHash = require('../util/cidFromHash')
const createResolver = require('../util/createResolver')
const emptyCodeHash = require('../util/emptyCodeHash')

const fieldAccess = () => {
  const getters = {
    storage: function () {
      return cidFromHash(multicodec.ETH_STORAGE_TRIE, this.stateRoot)
    },
    code: function () {
      // resolve immediately if empty, otherwise link to code
      if (emptyCodeHash.equals(this.codeHash)) {
        return Buffer.from('')
      } else {
        return cidFromHash(multicodec.RAW, this.codeHash)
      }
    }
  }

  const values = {
    isEmpty: function () { return this.isEmpty() },
    isContract: function () { return this.isContract() }
  }

  const removeEnumerables = ['raw', 'serialize', 'toJSON']

  return {
    getters,
    removeEnumerables,
    values
  }
}

module.exports = createResolver(
  multicodec.ETH_ACCOUNT_SNAPSHOT, EthAccount, fieldAccess)

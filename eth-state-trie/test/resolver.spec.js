/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const async = require('async')
const Account = require('ethereumjs-account')
const Trie = require('merkle-patricia-tree')
const multicodec = require('multicodec')
const CID = require('cids')
const ipldEthStateTrie = require('../index')
const resolver = ipldEthStateTrie.resolver

describe('IPLD format resolver (local)', () => {
  // setup contract test data
  let testContract
  let testContractData = {
    balance: Buffer.from('012345', 'hex'),
    codeHash: Buffer.from('abcd04a817c80004a817c80004a817c80004a817c80004a817c80004a817c800', 'hex'),
    stateRoot: Buffer.from('012304a817c80004a817c80004a817c80004a817c80004a817c80004a817c800', 'hex')
  }

  // setup external account test data
  let testExternalAccount
  let testExternalAccountData = {
    balance: Buffer.from('abcdef', 'hex'),
    nonce: Buffer.from('02', 'hex')
  }

  // setup test trie
  let trie
  let trieNodes = {}
  let dagNodes = {}
  before(async () => {
    trie = new Trie()
    testContract = new Account(testContractData)
    testExternalAccount = new Account(testExternalAccountData)
    await populateTrie(trie)
    await dumpTrieNonInlineNodes(trie, trieNodes)
    Object.entries(trieNodes).map(([key, node]) => {
      dagNodes[key] = ipldEthStateTrie.util.serialize(node)
    })
  })

  function populateTrie (trie) {
    return new Promise((resolve, reject) => {
      async.series([
        (cb) => trie.put(Buffer.from('000a0a00', 'hex'), testExternalAccount.serialize(), cb),
        (cb) => trie.put(Buffer.from('000a0a01', 'hex'), testExternalAccount.serialize(), cb),
        (cb) => trie.put(Buffer.from('000a0a02', 'hex'), testExternalAccount.serialize(), cb),
        (cb) => trie.put(Buffer.from('000a0b00', 'hex'), testExternalAccount.serialize(), cb),
        (cb) => trie.put(Buffer.from('000b0a00', 'hex'), testContract.serialize(), cb),
        (cb) => trie.put(Buffer.from('000b0b00', 'hex'), testContract.serialize(), cb),
        (cb) => trie.put(Buffer.from('000c0a00', 'hex'), testContract.serialize(), cb)
      ], (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  it('multicodec is eth-state-trie', () => {
    expect(ipldEthStateTrie.codec).to.equal(multicodec.ETH_STATE_TRIE)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(ipldEthStateTrie.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  describe('resolver.resolve', () => {
    it('root node resolves to branch', async () => {
      const rootNode = dagNodes['']
      const result = resolver.resolve(rootNode, '0/0/0/c/0/a/0/0/codeHash')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('c/0/a/0/0/codeHash')
      expect(CID.isCID(trieNode)).to.be.true()
      const cid = await ipldEthStateTrie.util.cid(dagNodes['0/0/0'])
      expect(trieNode.equals(cid)).to.be.true()
    })

    it('neck node resolves down to c branch', async () => {
      const neckNode = dagNodes['0/0/0']
      const result = resolver.resolve(neckNode, 'c/0/a/0/0/codeHash')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('0/a/0/0/codeHash')
      expect(CID.isCID(trieNode)).to.be.true()
      const cid = await ipldEthStateTrie.util.cid(dagNodes['0/0/0/c'])
      expect(trieNode.equals(cid)).to.be.true()
    })

    it('"c" branch node resolves down to account data', () => {
      const cBranchNode = dagNodes['0/0/0/c']
      const result = resolver.resolve(cBranchNode, '0/a/0/0/codeHash')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('')
      expect(CID.isCID(trieNode)).to.be.false()
      expect(Buffer.isBuffer(result.value)).to.eql(true)
      expect(result.value.toString('hex')).to.eql(testContract.codeHash.toString('hex'))
    })
  })

  describe('resolver.tree', () => {
    it('"c" branch node lists account paths', () => {
      const cBranchNode = dagNodes['0/0/0/c']
      const tree = resolver.tree(cBranchNode)
      const paths = [...tree]
      expect(paths).to.have.members([
        '0',
        '0/a',
        '0/a/0',
        '0/a/0/0',
        '0/a/0/0/storage',
        '0/a/0/0/code',
        '0/a/0/0/stateRoot',
        '0/a/0/0/codeHash',
        '0/a/0/0/nonce',
        '0/a/0/0/balance',
        '0/a/0/0/isEmpty',
        '0/a/0/0/isContract'
      ])
    })
  })
})

function dumpTrieNonInlineNodes (trie, fullNodes) {
  return new Promise((resolve) => {
    trie._findDbNodes((nodeRef, node, key, next) => {
      fullNodes[nibbleToPath(key)] = node
      next()
    }, resolve)
  })
}

function nibbleToPath (data) {
  return data.map((num) => num.toString(16)).join('/')
}

/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const async = require('async')
const IpfsBlock = require('ipfs-block')
const Account = require('ethereumjs-account')
const Trie = require('merkle-patricia-tree')
const TrieNode = require('merkle-patricia-tree/trieNode')
const isExternalLink = require('ipld-eth-trie/src/common').isExternalLink
const multihashing = require('multihashing-async')
const CID = require('cids')
const ipldEthStateTrie = require('../src')
const resolver = ipldEthStateTrie.resolver

describe('IPLD format resolver (local)', () => {
  // setup contract test data
  let testContract
  let testContractData = {
    balance: new Buffer('012345', 'hex'),
    codeHash: new Buffer('abcd04a817c80004a817c80004a817c80004a817c80004a817c80004a817c800', 'hex'),
    stateRoot: new Buffer('012304a817c80004a817c80004a817c80004a817c80004a817c80004a817c800', 'hex')
  }
  function prepareTestContract (done) {
    testContract = new Account(testContractData)
    done()
  }

  // setup external account test data
  let testExternalAccount
  let testExternalAccountData = {
    balance: new Buffer('abcdef', 'hex'),
    nonce: new Buffer('02', 'hex')
  }
  function prepareTestExternalAccount (done) {
    testExternalAccount = new Account(testExternalAccountData)
    done()
  }

  // setup test trie
  let trie
  let trieNodes = []
  let dagNodes
  before((done) => {
    trie = new Trie()
    async.waterfall([
      (cb) => prepareTestContract(cb),
      (cb) => prepareTestExternalAccount(cb),
      (cb) => populateTrie(trie, cb),
      (cb) => dumpTrieNonInlineNodes(trie, trieNodes, cb),
      (cb) => async.map(trieNodes, ipldEthStateTrie.util.serialize, cb),
      (nodes, cb) => async.map(nodes, (s, cb) => {
        multihashing(s, 'keccak-256', (err, hash) => {
          if (err) {
            return cb(err)
          }
          cb(null, new IpfsBlock(s, new CID(1, resolver.multicodec, hash)))
        })
      }, cb)
    ], (err, result) => {
      if (err) {
        return done(err)
      }
      dagNodes = result
      done()
    })
  })

  function populateTrie (trie, cb) {
    async.series([
      (cb) => trie.put(new Buffer('000a0a00', 'hex'), testExternalAccount.serialize(), cb),
      (cb) => trie.put(new Buffer('000a0a01', 'hex'), testExternalAccount.serialize(), cb),
      (cb) => trie.put(new Buffer('000a0a02', 'hex'), testExternalAccount.serialize(), cb),
      (cb) => trie.put(new Buffer('000a0b00', 'hex'), testExternalAccount.serialize(), cb),
      (cb) => trie.put(new Buffer('000b0a00', 'hex'), testContract.serialize(), cb),
      (cb) => trie.put(new Buffer('000b0b00', 'hex'), testContract.serialize(), cb),
      (cb) => trie.put(new Buffer('000c0a00', 'hex'), testContract.serialize(), cb)
    ], (err) => {
      if (err) return cb(err)
      cb()
    })
  }

  it('multicodec is eth-state-trie', () => {
    expect(resolver.multicodec).to.equal('eth-state-trie')
  })

  describe('resolver.resolve', () => {
    it('root node resolves to branch', (done) => {
      let rootNode = dagNodes[0]
      resolver.resolve(rootNode, '0/0/0/c/0/a/0/0/codeHash', (err, result) => {
        expect(err).to.not.exist()
        let trieNode = result.value
        expect(result.remainderPath).to.eql('c/0/a/0/0/codeHash')
        expect(isExternalLink(trieNode)).to.eql(true)
        done()
      })
    })

    it('"c" branch node resolves down to account data', (done) => {
      let cBranchNode = dagNodes[4]
      resolver.resolve(cBranchNode, 'c/0/a/0/0/codeHash', (err, result) => {
        expect(err).to.not.exist()
        let trieNode = result.value
        expect(result.remainderPath).to.eql('')
        expect(isExternalLink(trieNode)).to.eql(false)
        expect(Buffer.isBuffer(result.value)).to.eql(true)
        expect(result.value.toString('hex')).to.eql(testContract.codeHash.toString('hex'))
        done()
      })
    })
  })

  describe('resolver.tree', () => {
    it('"c" branch node lists account paths', (done) => {
      let cBranchNode = dagNodes[4]
      resolver.tree(cBranchNode, (err, result) => {
        expect(err).to.not.exist()
        let childPaths = result.map(item => item.path)
        expect(childPaths).to.contain('balance')
        done()
      })
    })
  })
})

function dumpTrieNonInlineNodes (trie, fullNodes, cb) {
  let inlineNodes = []
  trie._walkTrie(trie.root, (root, node, key, walkController) => {
    // skip inline nodes
    if (contains(inlineNodes, node.raw)) return walkController.next()
    fullNodes.push(node)
    // check children for inline nodes
    node.getChildren().forEach((child) => {
      let value = child[1]
      if (TrieNode.isRawNode(value)) {
        inlineNodes.push(value)
      }
    })
    // continue
    walkController.next()
  }, cb)
}

function contains (array, item) {
  return array.indexOf(item) !== -1
}

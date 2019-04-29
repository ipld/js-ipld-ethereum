/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const CID = require('cids')
const async = require('async')
const Trie = require('merkle-patricia-tree')
const multicodec = require('multicodec')
const ipldEthStateTrie = require('../index')
const resolver = ipldEthStateTrie.resolver

describe('IPLD format resolver (local)', () => {
  // setup test trie
  let trie
  let trieNodes = []
  let dagNodes
  before(async () => {
    trie = new Trie()
    await populateTrie(trie)
    await dumpTrieNonInlineNodes(trie, trieNodes)
    dagNodes = trieNodes.map(ipldEthStateTrie.util.serialize)
  })

  function populateTrie (trie) {
    return new Promise((resolve, reject) => {
      async.series([
        (cb) => trie.put(Buffer.from('000a0a00', 'hex'), Buffer.from('cafe01', 'hex'), cb),
        (cb) => trie.put(Buffer.from('000a0a01', 'hex'), Buffer.from('cafe02', 'hex'), cb),
        (cb) => trie.put(Buffer.from('000a0a02', 'hex'), Buffer.from('cafe03', 'hex'), cb),
        (cb) => trie.put(Buffer.from('000a0b00', 'hex'), Buffer.from('cafe04', 'hex'), cb),
        (cb) => trie.put(Buffer.from('000b0a00', 'hex'), Buffer.from('cafe05', 'hex'), cb),
        (cb) => trie.put(Buffer.from('000b0b00', 'hex'), Buffer.from('cafe06', 'hex'), cb),
        (cb) => trie.put(Buffer.from('000c0a00', 'hex'), Buffer.from('cafe07', 'hex'), cb)
      ], (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  it('multicodec is eth-storage-trie', () => {
    expect(ipldEthStateTrie.codec).to.equal(multicodec.ETH_STORAGE_TRIE)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(ipldEthStateTrie.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  describe('resolver.resolve', () => {
    it('root node resolves to neck', () => {
      const rootNode = dagNodes[0]
      const result = resolver.resolve(rootNode, '0/0/0/c/0/a/0/0/')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('c/0/a/0/0')
      expect(CID.isCID(trieNode)).to.be.true()
    })

    it('neck node resolves "c" down to buffer', () => {
      const node = dagNodes[1]
      const result = resolver.resolve(node, 'c/0/a/0/0/')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('')
      expect(CID.isCID(trieNode)).to.be.false()
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('neck node resolves "b" down to branch', () => {
      const node = dagNodes[1]
      const result = resolver.resolve(node, 'b/0/a/0/0/')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('0/a/0/0')
      expect(CID.isCID(trieNode)).to.be.true()
    })

    it('neck node resolves "a" down to branch', () => {
      const node = dagNodes[1]
      const result = resolver.resolve(node, 'a/0/a/0/0/')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('0/a/0/0')
      expect(CID.isCID(trieNode)).to.be.true()
    })
  })
})

function dumpTrieNonInlineNodes (trie, fullNodes) {
  return new Promise((resolve) => {
    trie._findDbNodes((nodeRef, node, key, next) => {
      fullNodes.push(node)
      next()
    }, resolve)
  })
}

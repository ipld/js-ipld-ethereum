/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const async = require('async')
const IpfsBlock = require('ipfs-block')
const Trie = require('merkle-patricia-tree')
const TrieNode = require('merkle-patricia-tree/trieNode')
const ipldEthTrie = require('../src')
const isExternalLink = require('../src/common').isExternalLink
const toIpfsBlock = require('../../util/toIpfsBlock')
const resolver = ipldEthTrie.resolver

describe('IPLD format resolver (local)', () => {
  let trie
  let trieNodes = []
  let dagNodes

  before((done) => {
    trie = new Trie()
    async.waterfall([
      (cb) => populateTrie(trie, cb),
      (cb) => dumpTrieNonInlineNodes(trie, trieNodes, cb),
      (cb) => async.map(trieNodes, ipldEthTrie.util.serialize, cb),
      (nodes, cb) => async.map(nodes, (node, cb) => {
        toIpfsBlock(resolver.multicodec, node, cb)
      }, cb)
    ], (err, result) => {
      if (err) return done(err)
      dagNodes = result
      done()
    })
  })

  describe('resolver.tree', () => {
    it('test root node', (done) => {
      let rootNode = dagNodes[0]
      resolver.tree('eth-storage-trie', rootNode, (err, children) => {
        expect(err).to.not.exist
        expect(Array.isArray(children)).to.eql(true)
        expect(children.length).to.eql(1)
        let child = children[0]
        expect(child.path).to.eql('0/0/0')
        expect(isExternalLink(child.value)).to.eql(true)
        done()
      })
    })

    it('test root first branch node', (done) => {
      let firstBranchNode = dagNodes[1]
      resolver.tree('eth-storage-trie', firstBranchNode, (err, children) => {
        expect(err).to.not.exist
        expect(Array.isArray(children)).to.eql(true)
        expect(children.length).to.eql(4)
        let child1 = children[0]
        expect(child1.path).to.eql('a')
        expect(isExternalLink(child1.value)).to.eql(true)
        let child2 = children[1]
        expect(child2.path).to.eql('b')
        expect(isExternalLink(child2.value)).to.eql(true)
        let child3 = children[2]
        expect(child3.path).to.eql('c')
        expect(isExternalLink(child3.value)).to.eql(false)
        let child4 = children[3]
        expect(child4.path).to.eql('d')
        expect(isExternalLink(child4.value)).to.eql(true)
        done()
      })
    })
  })

  describe('resolver.resolve', () => {
    it('root node resolves to first branch node', (done) => {
      let rootNode = dagNodes[0]
      let firstBranchNode = dagNodes[1]
      resolver.resolve('eth-storage-trie', rootNode, '0/0/0/a/0/a/0/0', (err, result) => {
        expect(err).to.not.exist
        let trieNode = result.value
        expect(trieNode.raw).to.eql(firstBranchNode.raw)
        expect(result.remainderPath).to.eql('a/0/a/0/0')
        done()
      })
    })

    it('first branch node resolves "a" to remote', (done) => {
      let firstBranchNode = dagNodes[1]
      resolver.resolve('eth-storage-trie', firstBranchNode, 'a/0/a/0/0', (err, result) => {
        expect(err).to.not.exist
        let trieNode = result.value
        expect(result.remainderPath).to.eql('0/a/0/0')
        expect(isExternalLink(trieNode)).to.eql(true)
        done()
      })
    })

    it('first branch node resolves "b" to remote', (done) => {
      let firstBranchNode = dagNodes[1]
      resolver.resolve('eth-storage-trie', firstBranchNode, 'b/0/a/0/0', (err, result) => {
        expect(err).to.not.exist
        let trieNode = result.value
        expect(result.remainderPath).to.eql('0/a/0/0')
        expect(isExternalLink(trieNode)).to.eql(true)
        done()
      })
    })

    it('first branch node resolves "c" entirely', (done) => {
      let firstBranchNode = dagNodes[1]
      resolver.resolve('eth-storage-trie', firstBranchNode, 'c/0/a/0/0', (err, result) => {
        expect(err).to.not.exist
        let trieNode = result.value
        expect(result.remainderPath).to.eql('')
        expect(isExternalLink(trieNode)).to.eql(false)
        expect(Buffer.isBuffer(result.value)).to.eql(true)
        expect(result.value.toString('hex')).to.eql('cafe07')
        done()
      })
    })

    it('first branch node resolves "c" with remainderPath', (done) => {
      let firstBranchNode = dagNodes[1]
      resolver.resolve('eth-storage-trie', firstBranchNode, 'c/0/a/0/0/storage/a', (err, result) => {
        expect(err).to.not.exist
        let trieNode = result.value
        expect(result.remainderPath).to.eql('storage/a')
        expect(isExternalLink(trieNode)).to.eql(false)
        expect(Buffer.isBuffer(result.value)).to.eql(true)
        expect(result.value.toString('hex')).to.eql('cafe07')
        done()
      })
    })

    it('first branch node resolves "d" with remainderPath', (done) => {
      let firstBranchNode = dagNodes[1]
      resolver.resolve('eth-storage-trie', firstBranchNode, 'd/0/0/0/1/balance', (err, result) => {
        expect(err).to.not.exist
        let trieNode = result.value
        expect(result.remainderPath).to.eql('0/0/0/1/balance')
        expect(isExternalLink(trieNode)).to.eql(true)
        done()
      })
    })

    it('"d" branch resolves leaf with no triePath in remainderPath', (done) => {
      let dBranchNode = dagNodes[4]
      resolver.resolve('eth-storage-trie', dBranchNode, '0/0/0/1/balance', (err, result) => {
        expect(err).to.not.exist
        let trieNode = result.value
        expect(result.remainderPath).to.eql('balance')
        expect(isExternalLink(trieNode)).to.eql(false)
        done()
      })
    })
  })
})

function populateTrie (trie, cb) {
  async.series([
    (cb) => trie.put(new Buffer('000a0a00', 'hex'), new Buffer('cafe01', 'hex'), cb),
    (cb) => trie.put(new Buffer('000a0a01', 'hex'), new Buffer('cafe02', 'hex'), cb),
    (cb) => trie.put(new Buffer('000a0a02', 'hex'), new Buffer('cafe03', 'hex'), cb),
    (cb) => trie.put(new Buffer('000a0b00', 'hex'), new Buffer('cafe04', 'hex'), cb),
    (cb) => trie.put(new Buffer('000b0a00', 'hex'), new Buffer('cafe05', 'hex'), cb),
    (cb) => trie.put(new Buffer('000b0b00', 'hex'), new Buffer('cafe06', 'hex'), cb),
    (cb) => trie.put(new Buffer('000c0a00', 'hex'), new Buffer('cafe07', 'hex'), cb),
    (cb) => trie.put(new Buffer('000d0001', 'hex'), new Buffer('cafe08', 'hex'), cb),
    (cb) => trie.put(new Buffer('000d0002', 'hex'), new Buffer('cafe08', 'hex'), cb)
  ], (err) => {
    if (err) return cb(err)
    cb()
  })
}

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

/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const CID = require('cids')
const Trie = require('merkle-patricia-tree')
const multicodec = require('multicodec')
const promisify = require('promisify-es6')
const { Buffer } = require('buffer')
const ipldEthStateTrie = require('../index')
const resolver = ipldEthStateTrie.resolver

describe('IPLD format resolver (local)', () => {
  // setup test trie
  let dagNodes
  before(async () => {
    const trie = await populateTrie()
    const trieNodes = await dumpTrieNonInlineNodes(trie)
    dagNodes = trieNodes.map((node) => {
      return ipldEthStateTrie.util.serialize({ _ethObj: node })
    })
  })

  async function populateTrie () {
    const trie = new Trie()
    const put = promisify(trie.put.bind(trie))
    await put(Buffer.from('000a0a00', 'hex'), Buffer.from('cafe01', 'hex'))
    await put(Buffer.from('000a0a01', 'hex'), Buffer.from('cafe02', 'hex'))
    await put(Buffer.from('000a0a02', 'hex'), Buffer.from('cafe03', 'hex'))
    await put(Buffer.from('000a0b00', 'hex'), Buffer.from('cafe04', 'hex'))
    await put(Buffer.from('000b0a00', 'hex'), Buffer.from('cafe05', 'hex'))
    await put(Buffer.from('000b0b00', 'hex'), Buffer.from('cafe06', 'hex'))
    await put(Buffer.from('000c0a00', 'hex'), Buffer.from('cafe07', 'hex'))
    return trie
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

    it('resolves "a" to correct type', () => {
      const result = resolver.resolve(dagNodes[1], 'a')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "b" to correct type', () => {
      const result = resolver.resolve(dagNodes[1], 'b')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "c" to correct type', () => {
      const result = resolver.resolve(dagNodes[1], 'c')
      expect(CID.isCID(result.value)).to.be.false()
      expect(typeof result.value === 'object').to.be.true()
    })

    it('resolves "c/0" to correct type', () => {
      const result = resolver.resolve(dagNodes[1], 'c/0')
      expect(CID.isCID(result.value)).to.be.false()
      expect(typeof result.value === 'object').to.be.true()
    })

    it('resolves "c/0/a" to correct type', () => {
      const result = resolver.resolve(dagNodes[1], 'c/0/a')
      expect(CID.isCID(result.value)).to.be.false()
      expect(typeof result.value === 'object').to.be.true()
    })

    it('resolves "c/0/a/0" to correct type', () => {
      const result = resolver.resolve(dagNodes[1], 'c/0/a/0')
      expect(CID.isCID(result.value)).to.be.false()
      expect(typeof result.value === 'object').to.be.true()
    })

    it('resolves "c/0/a/0/0" to correct type', () => {
      const result = resolver.resolve(dagNodes[1], 'c/0/a/0/0')
      expect(CID.isCID(result.value)).to.be.false()
      expect(typeof result.value === 'object').to.be.true()
    })
  })

  describe('resolver.tree', () => {
    it('returns all uncles', () => {
      const tree = resolver.tree(dagNodes[1])
      const paths = [...tree]
      expect(paths).to.have.members([
        'a',
        'b',
        'c',
        'c/0',
        'c/0/a',
        'c/0/a/0',
        'c/0/a/0/0'
      ])
    })
  })
})

function dumpTrieNonInlineNodes (trie) {
  const fullNodes = []
  return new Promise((resolve, reject) => {
    trie._findDbNodes((nodeRef, node, key, next) => {
      fullNodes.push(node)
      next()
    }, (err) => {
      if (err) {
        return reject(err)
      }
      return resolve(fullNodes)
    })
  })
}

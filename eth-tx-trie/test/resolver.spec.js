/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const CID = require('cids')
const EthBlock = require('ethereumjs-block')
const EthTx = require('ethereumjs-tx').Transaction
const multicodec = require('multicodec')
const promisify = require('promisify-es6')
const { Buffer } = require('buffer')
const ipldEthTxTrie = require('../index')
const resolver = ipldEthTxTrie.resolver

describe('IPLD format resolver (local)', () => {
  // setup test trie
  let ethBlock
  let dagNodes
  before(async () => {
    const trie = await populateTrie()
    const trieNodes = await dumpTrieDbNodes(trie)
    dagNodes = trieNodes.map((node) => {
      return ipldEthTxTrie.util.serialize({ _ethObj: node })
    })
  })

  async function populateTrie () {
    ethBlock = new EthBlock()
    // taken from block 0xc596cb892b649b4917da8c6b78611346d55daf7bcf4375da86a2d98810888e84
    ethBlock.transactions = [
      new EthTx({
        to: Buffer.from('0c7c0b72004a7a66ffa780637427fed0c4faac47', 'hex'),
        from: Buffer.from('41959417325160f8952bc933ae8317b4e5140dda', 'hex'),
        gas: Buffer.from('5e1b', 'hex'),
        gasPrice: Buffer.from('098bca5a00', 'hex'),
        input: null,
        nonce: Buffer.from('00', 'hex'),
        value: Buffer.from('44004c09e76a0000', 'hex'),
        r: Buffer.from('7150d00a9dcd8a8287ad220010c52ff2608906b746de23c993999768091ff210', 'hex'),
        s: Buffer.from('5585fabcd1dc415e1668d4cbc2d419cf0381bf9707480ad2f86d0800732f6d7e', 'hex'),
        v: Buffer.from('1b', 'hex')
      }),
      new EthTx({
        to: Buffer.from('f4702bb51b8270729db362b0d4f82a56bdd66c65', 'hex'),
        from: Buffer.from('56ce1399be2831f8a3f918a0408c05bbad658ef3', 'hex'),
        gas: Buffer.from('5208', 'hex'),
        gasPrice: Buffer.from('04e3b29200', 'hex'),
        input: null,
        nonce: Buffer.from('9d', 'hex'),
        value: Buffer.from('120a871cc0020000', 'hex'),
        r: Buffer.from('5d92c10b5789801d4ce0fc558eedc6e6cccbaf0105a7c1f909feabcedfe56cd9', 'hex'),
        s: Buffer.from('72cc370fa5fd3b43c2ba4e9e70fea1b5e950b4261ab4274982d8ae15a3403a33', 'hex'),
        v: Buffer.from('1b', 'hex')
      }),
      new EthTx({
        to: Buffer.from('b8201140a49b0d5b65a23b4b2fa8a6efff87c576', 'hex'),
        from: Buffer.from('1e9939daaad6924ad004c2560e90804164900341', 'hex'),
        gas: Buffer.from('9858', 'hex'),
        gasPrice: Buffer.from('04a817c800', 'hex'),
        input: null,
        nonce: Buffer.from('022f5d', 'hex'),
        value: Buffer.from('0de4ea09ac8f1e88', 'hex'),
        r: Buffer.from('7ee15b226f6c767ccace78a4b5b4cbf0be6ec20a899e058d3c95977bacd0cbd5', 'hex'),
        s: Buffer.from('27e75bcd3bfd199e8c3e3f0c90b0d39f01b773b3da64060e06c0d568ae5c7523', 'hex'),
        v: Buffer.from('1b', 'hex')
      }),
      new EthTx({
        to: Buffer.from('c4f381af25c41786110242623373cc9c7647f3f1', 'hex'),
        from: Buffer.from('ea674fdde714fd979de3edf0f56aa9716b898ec8', 'hex'),
        gas: Buffer.from('015f90', 'hex'),
        gasPrice: Buffer.from('04a817c800', 'hex'),
        input: null,
        nonce: Buffer.from('0fc02d', 'hex'),
        value: Buffer.from('0e139507cd50c018', 'hex'),
        r: Buffer.from('059934eeace580cc2bdc292415976692c751f0bcb025930bd40fcc31e91208f3', 'hex'),
        s: Buffer.from('77ff34a10a3de0d906a0363b4bdbc0e9a06cb4378476d96dfd446225d8d9949c', 'hex'),
        v: Buffer.from('1c', 'hex')
      })
    ]
    await promisify(ethBlock.genTxTrie.bind(ethBlock))()
    return ethBlock.txTrie
  }

  it('multicodec is eth-tx-trie', () => {
    expect(ipldEthTxTrie.codec).to.equal(multicodec.ETH_TX_TRIE)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(ipldEthTxTrie.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  describe('resolver.resolve', () => {
    it('root node resolving first tx value', () => {
      const rootNode = dagNodes[0]
      const result = resolver.resolve(rootNode, '8/0/value')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('0/value')
      expect(CID.isCID(trieNode)).to.be.true()
    })

    it('"8" branch node resolves down to tx value', () => {
      const branchNode = dagNodes[2]
      const result = resolver.resolve(branchNode, '0/value')
      const trieNode = result.value
      expect(result.remainderPath).to.eql('')
      expect(CID.isCID(trieNode)).to.be.false()
      expect(Buffer.isBuffer(result.value)).to.be.true()
      const firstTx = ethBlock.transactions[0]
      expect(result.value.toString('hex')).to.eql(firstTx.value.toString('hex'))
    })

    it('resolves "0" to correct type', () => {
      const result = resolver.resolve(dagNodes[0], '0')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "8" to correct type', () => {
      const result = resolver.resolve(dagNodes[0], '0')
      expect(CID.isCID(result.value)).to.be.true()
    })
  })

  describe('resolver.tree', () => {
    it('root has two children', () => {
      const rootNode = dagNodes[0]
      const tree = resolver.tree(rootNode)
      const paths = [...tree]
      expect(paths).to.have.members([
        '0',
        '8'
      ])
    })
  })
})

function dumpTrieDbNodes (trie) {
  const fullNodes = []
  return new Promise((resolve, reject) => {
    trie._findDbNodes((root, node, key, next) => {
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

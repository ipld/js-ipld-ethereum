/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const CID = require('cids')
const multihash = require('multihashes')
const multicodec = require('multicodec')
const EthBlockFromRpc = require('ethereumjs-block/from-rpc')

const dagEthBlockList = require('../index')
const resolver = dagEthBlockList.resolver
const block97Data = require('./data/block97.json')
const ommerData0 = require('./data/ommer0.json')
const ommerData1 = require('./data/ommer1.json')

describe('IPLD format resolver (local)', () => {
  const ethBlock = EthBlockFromRpc(block97Data, [ommerData0, ommerData1])
  const uncleHeaders = ethBlock.uncleHeaders.map((block) => {
    return { _ethObj: block }
  })
  const testBlob = dagEthBlockList.util.serialize(uncleHeaders)

  it('multicodec is eth-block-list', () => {
    expect(dagEthBlockList.codec).to.equal(multicodec.ETH_BLOCK_LIST)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(dagEthBlockList.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  describe('resolver.resolve', () => {
    it('uncle #0', () => {
      const result = resolver.resolve(testBlob, '0')
      expect(
        result.value._ethObj.hash().toString('hex')
      ).to.equal(
        'acfa207ce9d5139b85ecfdc197f8d283fc241f95f176f008f44aab35ef1f901f'
      )
      expect(result.remainderPath).to.equal('')
    })

    it('uncle #1', () => {
      const result = resolver.resolve(testBlob, '1')
      expect(
        result.value._ethObj.hash().toString('hex')
      ).to.equal(
        'fe426f2eb0adc88f05ea737da1ebb79e03bca546563ad74bda7bffeb37ad4d6a'
      )
      expect(result.remainderPath).to.equal('')
    })

    it('uncle count', () => {
      const result = resolver.resolve(testBlob, 'count')
      expect(result.value).to.equal(2)
      expect(result.remainderPath).to.equal('')
    })

    it('resolve block data off uncle #0', () => {
      const result = resolver.resolve(testBlob, '0/timestamp')
      expect(result.remainderPath.length).to.equal(0)
      expect(result.value.toString('hex')).to.equal('55ba43df')
      expect(result.remainderPath).to.equal('')
    })

    it('resolves root to correct type', () => {
      const result = resolver.resolve(testBlob, '')
      expect(Array.isArray(result.value)).to.be.true()
    })

    it('resolves "0" to correct type', () => {
      const result = resolver.resolve(testBlob, '0')
      expect(typeof result.value === 'object').to.be.true()
    })

    // Only testing `parent` here as the rest of the properties is already
    // tested by the eth-block tests
    it('resolves "parent" to correct type', () => {
      const result = resolver.resolve(testBlob, '0/parent')
      expect(CID.isCID(result.value)).to.be.true()
    })
  })

  describe('resolver.tree', () => {
    it('returns all uncles', () => {
      const tree = resolver.tree(testBlob)
      const paths = [...tree]
      expect(paths).to.have.members([
        'count',
        '0',
        '0/parent',
        '0/ommers',
        '0/transactions',
        '0/transactionReceipts',
        '0/state',
        '0/parentHash',
        '0/ommerHash',
        '0/transactionTrieRoot',
        '0/transactionReceiptTrieRoot',
        '0/stateRoot',
        '0/authorAddress',
        '0/bloom',
        '0/difficulty',
        '0/number',
        '0/gasLimit',
        '0/gasUsed',
        '0/timestamp',
        '0/extraData',
        '0/mixHash',
        '0/nonce',
        '1',
        '1/parent',
        '1/ommers',
        '1/transactions',
        '1/transactionReceipts',
        '1/state',
        '1/parentHash',
        '1/ommerHash',
        '1/transactionTrieRoot',
        '1/transactionReceiptTrieRoot',
        '1/stateRoot',
        '1/authorAddress',
        '1/bloom',
        '1/difficulty',
        '1/number',
        '1/gasLimit',
        '1/gasUsed',
        '1/timestamp',
        '1/extraData',
        '1/mixHash',
        '1/nonce'
      ])
    })
  })

  describe('util', () => {
    it('generates correct cid', async () => {
      const cid = await dagEthBlockList.util.cid(testBlob)
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-block-list')
      const mhash = multihash.decode(cid.multihash)
      expect(mhash.name).to.equal('keccak-256')
      expect(mhash.digest.toString('hex')).to.equal(ethBlock.header.uncleHash.toString('hex'))
    })

    it('should create CID, no options', async () => {
      const cid = await dagEthBlockList.util.cid(testBlob)
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-block-list')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-256')
    })

    it('should create CID, empty options', async () => {
      const cid = await dagEthBlockList.util.cid(ethBlock.uncleHeaders, {})
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-block-list')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-256')
    })

    it('should create CID, hashAlg', async () => {
      const cid = await dagEthBlockList.util.cid(testBlob, {
        hashAlg: multicodec.KECCAK_512
      })
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-block-list')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-512')
    })
  })
})

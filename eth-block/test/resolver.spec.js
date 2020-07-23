/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const CID = require('cids')
const EthBlockHeader = require('ethereumjs-block/header')
const multihash = require('multihashes')
const multicodec = require('multicodec')
const { Buffer } = require('buffer')

const ipldEthBlock = require('../index')
const resolver = ipldEthBlock.resolver

describe('IPLD format resolver (local)', () => {
  const testData = {
    //                            12345678901234567890123456789012
    parentHash: Buffer.from('0100000000000000000000000000000000000000000000000000000000000000', 'hex'),
    uncleHash: Buffer.from('0200000000000000000000000000000000000000000000000000000000000000', 'hex'),
    coinbase: Buffer.from('0300000000000000000000000000000000000000', 'hex'),
    stateRoot: Buffer.from('0400000000000000000000000000000000000000000000000000000000000000', 'hex'),
    transactionsTrie: Buffer.from('0500000000000000000000000000000000000000000000000000000000000000', 'hex'),
    receiptTrie: Buffer.from('0600000000000000000000000000000000000000000000000000000000000000', 'hex'),
    // bloom:            Buffer.from('07000000000000000000000000000000', 'hex'),
    difficulty: Buffer.from('0800000000000000000000000000000000000000000000000000000000000000', 'hex'),
    number: Buffer.from('0900000000000000000000000000000000000000000000000000000000000000', 'hex'),
    gasLimit: Buffer.from('1000000000000000000000000000000000000000000000000000000000000000', 'hex'),
    gasUsed: Buffer.from('1100000000000000000000000000000000000000000000000000000000000000', 'hex'),
    timestamp: Buffer.from('1200000000000000000000000000000000000000000000000000000000000000', 'hex'),
    extraData: Buffer.from('1300000000000000000000000000000000000000000000000000000000000000', 'hex'),
    mixHash: Buffer.from('1400000000000000000000000000000000000000000000000000000000000000', 'hex'),
    nonce: Buffer.from('1500000000000000000000000000000000000000000000000000000000000000', 'hex')
  }
  const testEthBlock = new EthBlockHeader(testData)
  const testBlob = ipldEthBlock.util.serialize({
    _ethObj: testEthBlock
  })

  it('multicodec is eth-block', () => {
    expect(ipldEthBlock.codec).to.equal(multicodec.ETH_BLOCK)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(ipldEthBlock.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  it('can parse the cid', async () => {
    const cid = await ipldEthBlock.util.cid(testBlob)
    const encodedCid = cid.toBaseEncodedString()
    const reconstructedCid = new CID(encodedCid)
    expect(cid.version).to.equal(reconstructedCid.version)
    expect(cid.codec).to.equal(reconstructedCid.codec)
    expect(cid.multihash.toString('hex')).to.equal(reconstructedCid.multihash.toString('hex'))
  })

  describe('resolver.resolve', () => {
    it('path within scope', () => {
      const result = resolver.resolve(testBlob, 'number')
      expect(result.value.toString('hex')).to.equal(testData.number.toString('hex'))
    })

    it('resolves "parent" to correct type', () => {
      const result = resolver.resolve(testBlob, 'parent')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "ommers" to correct type', () => {
      const result = resolver.resolve(testBlob, 'ommers')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "transactions" to correct type', () => {
      const result = resolver.resolve(testBlob, 'transactions')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "transactionReceipts" to correct type', () => {
      const result = resolver.resolve(testBlob, 'transactionReceipts')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "state" to correct type', () => {
      const result = resolver.resolve(testBlob, 'state')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "parentHash" to correct type', () => {
      const result = resolver.resolve(testBlob, 'parentHash')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "ommerHash" to correct type', () => {
      const result = resolver.resolve(testBlob, 'ommerHash')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "transactionTrieRoot" to correct type', () => {
      const result = resolver.resolve(testBlob, 'transactionTrieRoot')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "transactionReceiptTrieRoot" to correct type', () => {
      const result = resolver.resolve(testBlob, 'transactionReceiptTrieRoot')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "stateRoot" to correct type', () => {
      const result = resolver.resolve(testBlob, 'stateRoot')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "authorAddress" to correct type', () => {
      const result = resolver.resolve(testBlob, 'authorAddress')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "bloom" to correct type', () => {
      const result = resolver.resolve(testBlob, 'bloom')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "difficulty" to correct type', () => {
      const result = resolver.resolve(testBlob, 'difficulty')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "number" to correct type', () => {
      const result = resolver.resolve(testBlob, 'number')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "gasLimit" to correct type', () => {
      const result = resolver.resolve(testBlob, 'gasLimit')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "gasUsed" to correct type', () => {
      const result = resolver.resolve(testBlob, 'gasUsed')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "timestamp" to correct type', () => {
      const result = resolver.resolve(testBlob, 'timestamp')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "extraData" to correct type', () => {
      const result = resolver.resolve(testBlob, 'extraData')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "mixHash" to correct type', () => {
      const result = resolver.resolve(testBlob, 'mixHash')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "nonce" to correct type', () => {
      const result = resolver.resolve(testBlob, 'nonce')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })
  })

  it('resolver.tree', async () => {
    const tree = resolver.tree(testBlob)
    const paths = [...tree]
    expect(paths).to.have.members([
      'parent',
      'ommers',
      'transactions',
      'transactionReceipts',
      'state',
      'parentHash',
      'ommerHash',
      'transactionTrieRoot',
      'transactionReceiptTrieRoot',
      'stateRoot',
      'authorAddress',
      'bloom',
      'difficulty',
      'number',
      'gasLimit',
      'gasUsed',
      'timestamp',
      'extraData',
      'mixHash',
      'nonce'
    ])
  })

  describe('util', () => {
    it('should create CID, no options', async () => {
      const cid = await ipldEthBlock.util.cid(testBlob)
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-block')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-256')
    })

    it('should create CID, empty options', async () => {
      const cid = await ipldEthBlock.util.cid(testBlob, {})
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-block')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-256')
    })

    it('should create CID, hashAlg', async () => {
      const cid = await ipldEthBlock.util.cid(testBlob, {
        hashAlg: multicodec.KECCAK_512
      })
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-block')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-512')
    })
  })
})

describe('manual ancestor walking', () => {
  let cid1
  let cid2
  let ethBlock1
  let ethBlock2
  let ethBlock3
  let serialized1
  let serialized2
  let serialized3

  before(async () => {
    ethBlock1 = {
      _ethObj: new EthBlockHeader({
        number: 1
      })
    }
    serialized1 = ipldEthBlock.util.serialize(ethBlock1)
    cid1 = await ipldEthBlock.util.cid(serialized1)

    ethBlock2 = {
      _ethObj: new EthBlockHeader({
        number: 2,
        parentHash: ethBlock1._ethObj.hash()
      })
    }
    serialized2 = ipldEthBlock.util.serialize(ethBlock2)
    cid2 = await ipldEthBlock.util.cid(serialized2)

    ethBlock3 = {
      _ethObj: new EthBlockHeader({
        number: 3,
        parentHash: ethBlock2._ethObj.hash()
      })
    }
    serialized3 = ipldEthBlock.util.serialize(ethBlock3)
    await ipldEthBlock.util.cid(serialized3)
  })

  it('root path (same as get)', () => {
    const result = ipldEthBlock.resolver.resolve(serialized1, '/')
    const deserialized = ipldEthBlock.util.deserialize(serialized1)
    expect(result.value).to.eql(deserialized)
  })

  it('value within 1st node scope', () => {
    const result = ipldEthBlock.resolver.resolve(serialized3, 'number')
    expect(result.remainderPath).to.eql('')
    expect(CID.isCID(result.value)).to.be.false()
    expect(result.value.toString('hex')).to.eql('03')
  })

  it('value within nested scope (1 level)', () => {
    const result = ipldEthBlock.resolver.resolve(serialized3, 'parent/number')
    expect(result.remainderPath).to.eql('number')
    expect(CID.isCID(result.value)).to.be.true()
    expect(result.value.equals(cid2)).to.be.true()

    const result2 = ipldEthBlock.resolver.resolve(serialized2, result.remainderPath)
    expect(result2.remainderPath).to.eql('')
    expect(CID.isCID(result2.value)).to.be.false()
    expect(result2.value.toString('hex')).to.eql('02')
  })

  it('value within nested scope (2 levels)', () => {
    const result = ipldEthBlock.resolver.resolve(serialized3, 'parent/parent/number')
    expect(result.remainderPath).to.eql('parent/number')
    expect(CID.isCID(result.value)).to.be.true()
    expect(result.value.equals(cid2)).to.be.true()

    const result2 = ipldEthBlock.resolver.resolve(serialized2, result.remainderPath)
    expect(result2.remainderPath).to.eql('number')
    expect(CID.isCID(result2.value)).to.be.true()
    expect(result2.value.equals(cid1)).to.be.true()

    const result3 = ipldEthBlock.resolver.resolve(serialized1, result2.remainderPath)
    expect(result3.remainderPath).to.eql('')
    expect(CID.isCID(result3.value)).to.be.false()
    expect(result3.value.toString('hex')).to.eql('01')
  })
})

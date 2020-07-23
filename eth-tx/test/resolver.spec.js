/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const Transaction = require('ethereumjs-tx').Transaction
const dagEthTx = require('../index')
const resolver = dagEthTx.resolver
const util = dagEthTx.util
const multihash = require('multihashes')
const multicodec = require('multicodec')
const { Buffer } = require('buffer')

describe('IPLD format resolver (local)', () => {
  const testData = {
    nonce: Buffer.from('01', 'hex'),
    gasPrice: Buffer.from('04a817c800', 'hex'),
    gasLimit: Buffer.from('061a80', 'hex'),
    to: Buffer.from('0731729bb6624343958d05be7b1d9257a8e802e7', 'hex'),
    value: Buffer.from('1234', 'hex'),
    // signature
    v: Buffer.from('1c', 'hex'),
    r: Buffer.from('33752a492fb77aca190ba9ba356bb8c9ad22d9aaa82c10bc8fc8ccca70da1985', 'hex'),
    s: Buffer.from('6ee2a50ec62e958fa2c9e214dae7de8ab4ab9a951b621a9deb04bb1bb37dd20f', 'hex')
  }
  const testTx = new Transaction(testData)
  const testTxBlob = dagEthTx.util.serialize({
    _ethObj: testTx
  })

  it('multicodec is eth-tx', () => {
    expect(dagEthTx.codec).to.equal(multicodec.ETH_TX)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(dagEthTx.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  describe('resolver.resolve', () => {
    it('path within scope', () => {
      const result = resolver.resolve(testTxBlob, 'nonce')
      expect(result.value).to.eql(testData.nonce)
    })

    it('resolves "nonce" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'nonce')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "gasPrice" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'gasPrice')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "gasLimit" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'gasLimit')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "toAddress" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'toAddress')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "value" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'value')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "data" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'data')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "v" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'v')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "r" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'r')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "s" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 's')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "fromAddress" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'fromAddress')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "signature" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'signature')
      expect(Array.isArray(result.value)).to.be.true()
    })

    it('resolves "signature/0" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'signature/0')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "signature/1" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'signature/1')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "signature/2" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'signature/2')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "isContractPublish" to correct type', () => {
      const result = resolver.resolve(testTxBlob, 'isContractPublish')
      expect(typeof result.value).to.equal('boolean')
    })
  })

  it('resolver.tree', () => {
    const tree = resolver.tree(testTxBlob)
    const paths = [...tree]
    expect(paths).to.have.members([
      'nonce',
      'gasPrice',
      'gasLimit',
      'toAddress',
      'value',
      'data',
      'v',
      'r',
      's',
      'fromAddress',
      'signature',
      'signature/0',
      'signature/1',
      'signature/2',
      'isContractPublish'
    ])
  })

  describe('util', () => {
    it('create CID, no options', async () => {
      const cid = await util.cid(testTxBlob)
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-tx')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-256')
    })

    it('create CID, empty options', async () => {
      const cid = await util.cid(testTxBlob, {})
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-tx')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-256')
    })

    it('create CID, hashAlg', async () => {
      const cid = await util.cid(testTxBlob, {
        hashAlg: multicodec.KECCAK_512
      })
      expect(cid.version).to.equal(1)
      expect(cid.codec).to.equal('eth-tx')
      expect(cid.multihash).to.exist()
      const mh = multihash.decode(cid.multihash)
      expect(mh.name).to.equal('keccak-512')
    })
  })
})

/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const dagEthAccount = require('../index')
const resolver = dagEthAccount.resolver
const Account = require('ethereumjs-account').default
const emptyCodeHash = require('../../util/emptyCodeHash')
const CID = require('cids')
const multicodec = require('multicodec')
const { Buffer } = require('buffer')

describe('IPLD format resolver (local)', () => {
  const testData = {
    nonce: Buffer.from('02', 'hex'),
    balance: Buffer.from('04a817c800', 'hex'),
    codeHash: emptyCodeHash,
    stateRoot: Buffer.from('012304a817c80004a817c80004a817c80004a817c80004a817c80004a817c800', 'hex')
  }
  const testAccount = new Account(testData)
  const testBlob = dagEthAccount.util.serialize({
    _ethObj: testAccount
  })

  it('multicodec is eth-account-snapshot', () => {
    expect(dagEthAccount.codec).to.equal(multicodec.ETH_ACCOUNT_SNAPSHOT)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(dagEthAccount.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  describe('resolver.resolve', () => {
    it('path within scope', () => {
      const result = resolver.resolve(testBlob, 'nonce')
      expect(result.value).to.eql(testData.nonce)
    })

    it('resolves "storage" to correct type', () => {
      const result = resolver.resolve(testBlob, 'storage')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "code" to correct type', () => {
      const result = resolver.resolve(testBlob, 'storage')
      expect(CID.isCID(result.value)).to.be.true()
    })

    it('resolves "stateRoot" to correct type', () => {
      const result = resolver.resolve(testBlob, 'stateRoot')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "codeHash" to correct type', () => {
      const result = resolver.resolve(testBlob, 'codeHash')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "nonce" to correct type', () => {
      const result = resolver.resolve(testBlob, 'nonce')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "balance" to correct type', () => {
      const result = resolver.resolve(testBlob, 'balance')
      expect(Buffer.isBuffer(result.value)).to.be.true()
    })

    it('resolves "isEmpty" to correct type', () => {
      const result = resolver.resolve(testBlob, 'isEmpty')
      expect(result.value).to.be.false()
    })

    it('resolves "isContract" to correct type', () => {
      const result = resolver.resolve(testBlob, 'isContract')
      expect(result.value).to.be.false()
    })
  })

  it('resolves empty code', () => {
    const result = resolver.resolve(testBlob, 'code')
    expect(result.remainderPath).to.equal('')
    expect(Buffer.isBuffer(result.value)).to.be.true()
    expect(result.value.length).to.equal(0)
  })

  describe('resolver.tree', () => {
    it('basic sanity test', async () => {
      const tree = resolver.tree(testBlob)
      const paths = [...tree]
      expect(paths).to.have.members([
        'storage',
        'code',
        'stateRoot',
        'codeHash',
        'nonce',
        'balance',
        'isEmpty',
        'isContract'
      ])
    })
  })
})

/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const dagEthAccount = require('../index')
const resolver = dagEthAccount.resolver
const Account = require('ethereumjs-account')
const emptyCodeHash = require('../../util/emptyCodeHash')
const multicodec = require('multicodec')

describe('IPLD format resolver (local)', () => {
  const testData = {
    nonce: Buffer.from('02', 'hex'),
    balance: Buffer.from('04a817c800', 'hex'),
    codeHash: emptyCodeHash,
    stateRoot: Buffer.from('012304a817c80004a817c80004a817c80004a817c80004a817c80004a817c800', 'hex')
  }
  const testAccount = new Account(testData)
  const testBlob = dagEthAccount.util.serialize(testAccount)

  it('multicodec is eth-account-snapshot', () => {
    expect(dagEthAccount.codec).to.equal(multicodec.ETH_ACCOUNT_SNAPSHOT)
  })

  it('defaultHashAlg is keccak-256', () => {
    expect(dagEthAccount.defaultHashAlg).to.equal(multicodec.KECCAK_256)
  })

  describe('resolver.resolve', () => {
    it('path within scope', async () => {
      const result = await resolver.resolve(testBlob, 'nonce')
      expect(result.value).to.eql(testData.nonce)
    })
  })

  it('resolves empty code', async () => {
    const result = await resolver.resolve(testBlob, 'code')
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

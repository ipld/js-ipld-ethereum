/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const dagEthAccount = require('../index')
const resolver = dagEthAccount.resolver
const IpfsBlock = require('ipfs-block')
const Account = require('ethereumjs-account')
const toIpfsBlock = require('../../util/toIpfsBlock')
const emptyCodeHash = require('../../util/emptyCodeHash')

describe('IPLD format resolver (local)', () => {
  let testIpfsBlock
  let testData = {
    nonce: new Buffer('02', 'hex'),
    balance: new Buffer('04a817c800', 'hex'),
    codeHash: emptyCodeHash,
    stateRoot: new Buffer('012304a817c80004a817c80004a817c80004a817c80004a817c80004a817c800', 'hex')
  }

  before((done) => {
    const testAccount = new Account(testData)
    dagEthAccount.util.serialize(testAccount, (err, result) => {
      if (err) return done(err)
      toIpfsBlock(resolver.multicodec, result, (err, ipfsBlock) => {
        if (err) return done(err)
        testIpfsBlock = ipfsBlock
        done()
      })
    })
  })

  it('multicodec is eth-account-snapshot', () => {
    expect(resolver.multicodec).to.equal('eth-account-snapshot')
  })

  describe('resolver.resolve', () => {
    it('path within scope', () => {
      resolver.resolve(testIpfsBlock, 'nonce', (err, result) => {
        expect(err).to.not.exist
        expect(result.value.toString('hex')).to.equal(testData.nonce.toString('hex'))
      })
    })

    it('resolves empty code', () => {
      resolver.resolve(testIpfsBlock, 'code', (err, result) => {
        expect(err).to.not.exist
        expect(result.remainderPath).to.equal('')
        expect(Buffer.isBuffer(result.value)).to.equal(true)
        expect(result.value.length).to.equal(0)
      })
    })
  })

  describe('resolver.tree', () => {
    it('basic sanity test', () => {
      resolver.tree(testIpfsBlock, (err, paths) => {
        expect(err).to.not.exist
        expect(Array.isArray(paths)).to.eql(true)
      })
    })
  })
})

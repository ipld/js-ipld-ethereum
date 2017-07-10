/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const IpfsBlock = require('ipfs-block')
const Transaction = require('ethereumjs-tx')
const toIpfsBlock = require('../../util/toIpfsBlock')
const dagEthBlock = require('../index')
const resolver = dagEthBlock.resolver

describe('IPLD format resolver (local)', () => {
  let testIpfsBlock
  let testData = {
    nonce: new Buffer('01', 'hex'),
    gasPrice: new Buffer('04a817c800', 'hex'),
    gasLimit: new Buffer('061a80', 'hex'),
    to: new Buffer('0731729bb6624343958d05be7b1d9257a8e802e7', 'hex'),
    value: new Buffer('1234', 'hex'),
    // signature
    v: new Buffer('1c', 'hex'),
    r: new Buffer('33752a492fb77aca190ba9ba356bb8c9ad22d9aaa82c10bc8fc8ccca70da1985', 'hex'),
    s: new Buffer('6ee2a50ec62e958fa2c9e214dae7de8ab4ab9a951b621a9deb04bb1bb37dd20f', 'hex')
  }

  before((done) => {
    const testTx = new Transaction(testData)
    dagEthBlock.util.serialize(testTx, (err, result) => {
      if (err) return done(err)
      toIpfsBlock(resolver.multicodec, result, (err, ipfsBlock) => {
        if (err) return done(err)
        testIpfsBlock = ipfsBlock
        done()
      })
    })
  })

  it('multicodec is eth-tx', () => {
    expect(resolver.multicodec).to.equal('eth-tx')
  })

  describe('resolver.resolve', () => {
    it('path within scope', () => {
      resolver.resolve(testIpfsBlock, 'nonce', (err, result) => {
        expect(err).to.not.exist()
        expect(result.value.toString('hex')).to.equal(testData.nonce.toString('hex'))
        // expect(result.value).to.equal(testData.nonce.toString('hex'))
      })
    })
  })

  describe('resolver.resolve', () => {
    it('resolver.tree', () => {
      resolver.tree(testIpfsBlock, (err, paths) => {
        expect(err).to.not.exist()
        expect(typeof paths).to.eql('object')
        // expect(Array.isArray(paths)).to.eql(true)
      })
    })
  })
})

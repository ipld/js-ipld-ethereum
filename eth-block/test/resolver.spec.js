/* eslint-env mocha */
'use strict'

const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect
const CID = require('cids')
const IpfsBlock = require('ipfs-block')
const EthBlockHeader = require('ethereumjs-block/header')
const multihashing = require('multihashing-async')
const waterfall = require('async/waterfall')

const ipldEthBlock = require('../src')
const resolver = ipldEthBlock.resolver

describe('IPLD format resolver (local)', () => {
  let testIpfsBlock
  let testData = {
    //                            12345678901234567890123456789012
    parentHash: new Buffer('0100000000000000000000000000000000000000000000000000000000000000', 'hex'),
    uncleHash: new Buffer('0200000000000000000000000000000000000000000000000000000000000000', 'hex'),
    coinbase: new Buffer('0300000000000000000000000000000000000000', 'hex'),
    stateRoot: new Buffer('0400000000000000000000000000000000000000000000000000000000000000', 'hex'),
    transactionsTrie: new Buffer('0500000000000000000000000000000000000000000000000000000000000000', 'hex'),
    receiptTrie: new Buffer('0600000000000000000000000000000000000000000000000000000000000000', 'hex'),
    // bloom:            new Buffer('07000000000000000000000000000000', 'hex'),
    difficulty: new Buffer('0800000000000000000000000000000000000000000000000000000000000000', 'hex'),
    number: new Buffer('0900000000000000000000000000000000000000000000000000000000000000', 'hex'),
    gasLimit: new Buffer('1000000000000000000000000000000000000000000000000000000000000000', 'hex'),
    gasUsed: new Buffer('1100000000000000000000000000000000000000000000000000000000000000', 'hex'),
    timestamp: new Buffer('1200000000000000000000000000000000000000000000000000000000000000', 'hex'),
    extraData: new Buffer('1300000000000000000000000000000000000000000000000000000000000000', 'hex'),
    mixHash: new Buffer('1400000000000000000000000000000000000000000000000000000000000000', 'hex'),
    nonce: new Buffer('1500000000000000000000000000000000000000000000000000000000000000', 'hex')
  }

  before((done) => {
    const testEthBlock = new EthBlockHeader(testData)
    waterfall([
      (cb) => ipldEthBlock.util.serialize(testEthBlock, cb),
      (serialized, cb) => multihashing(serialized, 'keccak-256', (err, hash) => {
        if (err) {
          return cb(err)
        }
        testIpfsBlock = new IpfsBlock(serialized, new CID(hash))
        cb()
      })
    ], done)
  })

  it('multicodec is eth-block', () => {
    expect(resolver.multicodec).to.equal('eth-block')
  })

  it('can parse the cid', (done) => {
    const testEthBlock = new EthBlockHeader(testData)
    ipldEthBlock.util.cid(testEthBlock, (err, cid) => {
      expect(err).not.to.exist()
      let encodedCid = cid.toBaseEncodedString()
      let reconstructedCid = new CID(encodedCid)
      expect(cid.version).to.equal(reconstructedCid.version)
      expect(cid.codec).to.equal(reconstructedCid.codec)
      expect(cid.multihash.toString('hex')).to.equal(reconstructedCid.multihash.toString('hex'))
      done()
    })
  })

  describe('resolver.resolve', () => {
    it('path within scope', () => {
      resolver.resolve(testIpfsBlock, 'number', (err, result) => {
        expect(err).not.to.exist()
        expect(result.value.toString('hex')).to.equal(testData.number.toString('hex'))
      })
    })
  })

  it('resolver.tree', () => {
    resolver.tree(testIpfsBlock, (err, paths) => {
      expect(err).not.to.exist()
      expect(Array.isArray(paths)).to.eql(true)
    })
  })
})

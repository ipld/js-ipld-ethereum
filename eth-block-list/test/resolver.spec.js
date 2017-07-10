/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const IpfsBlock = require('ipfs-block')
const multihash = require('multihashes')
const RLP = require('rlp')
const EthBlock = require('ethereumjs-block')
const EthBlockFromRpc = require('ethereumjs-block/from-rpc')
const dagEthBlockList = require('../src')
const resolver = dagEthBlockList.resolver
const block97Data = require('./data/block97.json')
const ommerData0 = require('./data/ommer0.json')
const ommerData1 = require('./data/ommer1.json')


describe('IPLD format resolver (local)', () => {
  let testIpfsBlock
  let ethBlock = EthBlockFromRpc(block97Data, [ommerData0, ommerData1])

  before((done) => {
    let rawOmmers = ethBlock.uncleHeaders.map((ommerHeader) => ommerHeader.raw)
    dagEthBlockList.util.serialize(rawOmmers, (err, result) => {
      if (err) return done(err)
      testIpfsBlock = new IpfsBlock(result)
      done()
    })
  })

  it('multicodec is eth-block-list', () => {
    expect(resolver.multicodec).to.equal('eth-block-list')
  })

  describe('resolver.resolve', () => {
    it('uncle #0', (done) => {
      resolver.resolve(testIpfsBlock, '0', (err, result) => {
        expect(err).to.not.exist
        expect(result.value.hash().toString('hex')).to.equal('acfa207ce9d5139b85ecfdc197f8d283fc241f95f176f008f44aab35ef1f901f')
        expect(result.remainderPath).to.equal('')
        done()
      })
    })

    it('uncle #1', (done) => {
      resolver.resolve(testIpfsBlock, '1', (err, result) => {
        expect(err).to.not.exist
        expect(result.value.hash().toString('hex')).to.equal('fe426f2eb0adc88f05ea737da1ebb79e03bca546563ad74bda7bffeb37ad4d6a')
        expect(result.remainderPath).to.equal('')
        done()
      })
    })

    it('uncle count', (done) => {
      resolver.resolve(testIpfsBlock, 'count', (err, result) => {
        expect(err).to.not.exist
        expect(result.value).to.equal(2)
        expect(result.remainderPath).to.equal('')
        done()
      })
    })

    it('resolve block data off uncle #0', (done) => {
      resolver.resolve(testIpfsBlock, '0/timestamp', (err, result) => {
        expect(err).to.not.exist
        expect(result.value.toString('hex')).to.equal('55ba43df')
        expect(result.remainderPath).to.equal('')
        done()
      })
    })
  })

  describe('resolver.tree', () => {
    it('returns all uncles', (done) => {
      resolver.tree(testIpfsBlock, (err, paths) => {
        expect(err).to.not.exist
        expect(typeof paths).to.eql('object')
        expect(Array.isArray(paths)).to.eql(true)
        const expectedPaths = ethBlock.uncleHeaders.length * 21 + 1
        expect(paths.length).to.eql(expectedPaths)
        done()
      })
    })
  })

  describe('util', () => {
    it('generates correct cid', (done) => {
      let rawOmmers = ethBlock.uncleHeaders.map((ommerHeader) => ommerHeader.raw)
      dagEthBlockList.util.cid(rawOmmers, (err, cid) => {
        expect(err).to.not.exist
        expect(cid.version).to.equal(1)
        expect(cid.codec).to.equal('eth-block-list')
        let mhash = multihash.decode(cid.multihash)
        expect(mhash.name).to.equal('keccak-256')
        expect(mhash.digest.toString('hex')).to.equal(ethBlock.header.uncleHash.toString('hex'))
        done()
      })
    })
  })
})

'use strict'
const waterfall = require('async/waterfall')
const each = require('async/each')
const asyncify = require('async/asyncify')
const RLP = require('rlp')
const EthBlockHead = require('ethereumjs-block/header')
const multihash = require('multihashing-async')
const ethBlockResolver = require('../eth-block').resolver
const createResolver = require('../util/createResolver')
const cidFromHash = require('../util/cidFromHash')

const ethBlockListResolver = createResolver('eth-block-list', undefined, mapFromEthObj)
const util = ethBlockListResolver.util
util.serialize = asyncify((ethBlockList) => {
  const rawOmmers = ethBlockList.map((ethBlock) => ethBlock.raw)
  return RLP.encode(rawOmmers)
})
util.deserialize = asyncify((serialized) => {
  const rawOmmers = RLP.decode(serialized)
  return rawOmmers.map((rawBlock) => new EthBlockHead(rawBlock))
})
util.cid = (blockList, callback) => {
  waterfall([
    (cb) => util.serialize(blockList, cb),
    (data, cb) => multihash.digest(data, 'keccak-256', cb),
    asyncify((mhash) => cidFromHash('eth-block-list', mhash))
  ], callback)
}

module.exports = ethBlockListResolver


function mapFromEthObj (ethBlockList, options, callback) {
  let paths = []

  // external links (none)

  // external links as data (none)

  // helpers

  paths.push({
    path: 'count',
    value: ethBlockList.length
  })

  // internal data

  // add paths for each block
  each(ethBlockList, (ethBlock, next) => {
    const index = ethBlockList.indexOf(ethBlock)
    const blockPath = index.toString()
    // block root
    paths.push({
      path: blockPath,
      value: ethBlock
    })
    // block children
    ethBlockResolver._mapFromEthObject(ethBlock, {}, (err, subpaths) => {
      if (err) return next(err)
      // append blockPath to each subpath
      subpaths.forEach((path) => path.path = blockPath + '/' + path.path)
      paths = paths.concat(subpaths)
      next()
    })
  }, (err) => {
    if (err) return callback(err)
    callback(null, paths)
  })
}

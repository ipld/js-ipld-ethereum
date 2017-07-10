const IpfsBlock = require('ipfs-block')
const CID = require('cids')
const multihashing = require('multihashing-async')

module.exports = toIpfsBlock

function toIpfsBlock (multicodec, value, callback) {
  multihashing(value, 'keccak-256', (err, hash) => {
    if (err) {
      return callback(err)
    }
    const cid = new CID(1, multicodec, hash)
    callback(null, new IpfsBlock(value, cid))
  })
}

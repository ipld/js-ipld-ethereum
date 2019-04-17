'use strict'
const rlp = require('rlp')
const EthTrieNode = require('merkle-patricia-tree/trieNode')
const cidFromHash = require('./cidFromHash')
const createResolver = require('./createResolver')
const createUtil = require('./createUtil')

// A `nibble` is an array of nested keys. So for example `[2, 1, 3]` would
// mean an item with value `"foo"` would be in an object like this:
// {
//   "2": {
//     "1": {
//       "3": "foo"
//     }
//   }
// }
// This function converts such a nibble together with a `value` into such an
// object. As we want to combine multiple nibbles into a single object, we
// also pass in a `target` object where the value should be stored in.
const addNibbleToObject = (target, nibble, value) => {
  // Make a reference to the target object that can be changed in the course
  // of the algorithm
  let current = target
  for (const [ii, entry] of nibble.entries()) {
    // Get the key the value should be stored in
    const key = entry.toString(16)

    if (ii + 1 < nibble.length) {
    // We haven't reached the last item yet
      // There is no item with that key yet
      if (!(key in current)) {
        current[key] = {}
      }
      // Keep traversing deeper
      current = current[key]
    } else {
    // Else we've reached the last item, hence adding the actual value
      current[key] = value
      return
    }
  }
}

const getLeafValue = (trieNode, leafResolver) => {
  let value = trieNode.getValue()

  if (leafResolver !== undefined) {
    value = leafResolver.util.deserialize(value)
  }

  return value
}

// create map from merkle-patricia-tree nodes
const mapFromBaseTrie = (codec, finalNode, trieNode, leafResolver) => {
  if (trieNode.type === 'leaf') {
    const value = getLeafValue(trieNode, leafResolver)
    addNibbleToObject(finalNode, trieNode.getKey(), value)
    return
  }

  trieNode.getChildren().forEach(([nibble, value]) => {
    let valueToAdd
    if (EthTrieNode.isRawNode(value)) {
    // inline child root
      const childNode = new EthTrieNode(value)

      if (childNode.type === 'leaf') {
        // Make sure the object is nested correctly
        nibble.push(...childNode.getKey())
        valueToAdd = getLeafValue(childNode, leafResolver)
      } else {
        valueToAdd = childNode
      }
    } else {
    // other nodes link by hash
      valueToAdd = cidFromHash(codec, value)
    }
    addNibbleToObject(finalNode, nibble, valueToAdd)
  })
}

// The `createUtilResolver` expects a constructor with a single parameter,
// hence wrap it in a creator function so that we can pass in the needed
// context
const createCustomEthTrieNode = function (codec, leafResolver) {
  return function (serialized) {
    const rawNode = rlp.decode(serialized)
    const trieNode = new EthTrieNode(rawNode)

    const finalNode = {}
    mapFromBaseTrie(codec, finalNode, trieNode, leafResolver)
    return finalNode
  }
}

const createTrieResolver = (codec, leafResolver) => {
  const customEthTrieNode = createCustomEthTrieNode(codec, leafResolver)
  const baseTrie = createResolver(codec, customEthTrieNode)
  return baseTrie
}

module.exports = createTrieResolver

'use strict'

/**
 * Makes all properties with a leading underscore non-enumerable.
 *
 * @param {Object} object - The object it should be applied to
 */
const hidePrivateFields = (object) => {
  for (const key in object) {
    if (key[0] === '_') {
      Object.defineProperty(object, key, { enumerable: false })
    }
  }
}

/**
 * Makes a property no longer enumerable.
 *
 * @param {Object} object - The object it should be applied to
 * @param {Array.<String>} fields - The fields that should be made
 *   non-enumnerable
 */
const removeEnumerableProperty = (object, fields) => {
  for (const field of fields) {
    if (field in object) {
      Object.defineProperty(object, field, { enumerable: false })
    }
  }
}

/**
 * Applies visibility options to an object.
 *
 * @param {Object} object - The object it should be applied to
 * @param {Array.<String>} getters - The fields that should be made enumnerable
 * @param {Array.<String>} removeEnumerables - The fields that should be made
 *   enumerable
 * @param {Array.<String>} values - The fields that should be made
 *   non-enumnerable
 */
const applyVisibility = (object, getters, removeEnumerables, values) => {
  Object.entries(getters).forEach(([name, fun]) => {
    Object.defineProperty(object, name, {
      enumerable: true,
      get: fun
    })
  })
  Object.entries(values).forEach(([name, fun]) => {
    Object.defineProperty(object, name, {
      enumerable: true,
      value: fun
    })
  })
  removeEnumerableProperty(object, removeEnumerables)
  hidePrivateFields(object)
}


module.exports = {
  applyVisibility
}

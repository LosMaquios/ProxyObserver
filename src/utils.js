/**
 * Alias of `Object.prototype.hasOwnProperty`
 *
 * @type {Function}
 *
 * @api private
 */
export const hasOwn = Object.prototype.hasOwnProperty

/**
 * Determines whether a given `value` is observable
 *
 * @type {Function}
 *
 * @api private
 */
export const isObservable = value => typeof value === 'object' && value !== null && !(value instanceof Date)

/**
 * Determines whether a given `descriptor` is observable
 *
 * @param {Object} descriptor
 *
 * @return {boolean}
 */
export const isDescriptorObservable = descriptor => (

  // 1. Check for non-accessors
  !descriptor.get && !descriptor.set

  // 2. Check for observable value
  && isObservable(descriptor.value)

  // 3. Check for correct descriptor
  && (descriptor.configurable || descriptor.writable)
)

/**
 *
 * @param {*} value
 *
 * @return {boolean}
 */
export const isMapOrSet = value => value instanceof Map || value instanceof Set

/**
 *
 * @param {*} value
 *
 * @return {boolean}
 */
export const isWeakMapOrSet = value => value instanceof WeakMap || value instanceof WeakSet

/**
 * No-operation
 *
 * @type {Function}
 *
 * @api private
 */
export const noop = () => {}

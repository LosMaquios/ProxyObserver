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
export const isObservable = value => typeof value === 'object' && value !== null

/**
 * Determines whether a given `descriptor` is observable
 *
 * @param {Object} descriptor
 * @param {Object} options
 *
 * @return {boolean}
 */
export const isDescriptorObservable = (descriptor, options) => (

  // 1. Check for non-accessors
  !descriptor.get && !descriptor.set

  // 2. Check for observable value
  && isObservable(descriptor.value)

  // 3. Check for ignored value
  // An additional check for patch strategy is needed if we are ignoring native built-in objects
  && ((options.patch && (isMapOrSet(descriptor.value) || isWeakMapOrSet(descriptor.value))) || !options.ignore(descriptor.value))

  // 4. Check for correct descriptor
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

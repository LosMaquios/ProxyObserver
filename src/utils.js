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
export const isObservable = value => typeof value === 'object'

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

import { hasOwn, isObservable, isMapOrSet, isWeakMapOrSet, noop, isDescriptorObservable } from './utils'
import { patchFull, patchWeak } from './patch'

/**
 * Store observers internally
 *
 * @type {WeakMap}
 *
 * @api private
 */
const __observers__ = new WeakMap()

export default class ProxyObserver {

  /**
   * Initializes `ProxyObserver`
   *
   * @param {*} target - Value observed
   *
   * @api public
   */
  constructor (target) {

    /**
     * Value being observed
     *
     * @member {*}
     *
     * @api public
     */
    this.target = target

    /**
     * Subscriber functions
     *
     * @member {Set.<Function>}
     *
     * @api public
     */
    this.subscribers = new Set()
  }

  /**
   * Default observe options
   *
   * @type {Object}
   * @default
   *
   * @api public
   */
  static get observeOptions () {
    return {
      deep: true,
      patch: false
    }
  }

  /**
   * Returns true whether a given `value` is being observed
   * otherwise, returns false
   *
   * @param {*} value - The value itself
   *
   * @return {boolean}
   *
   * @api public
   */
  static is (value) {
    return isObservable(value) && __observers__.has(value)
  }

  /**
   * Gets the `ProxyObserver` instance from the given `value`
   *
   * @param {*} value - The value itself
   *
   * @return {ProxyObserver}
   *
   * @api public
   */
  static get (value) {
    return __observers__.get(value)
  }

  /**
   * Observe a given `target` to detect changes
   *
   * @param {*} target - The value to be observed
   * @param {Object} [options] - An object of options
   * @param {boolean} [options.deep] - Indicating whether observation should be deep
   * @param {Function} [_handler] - Internal global handler for deep observing
   *
   * @return {Proxy} Proxy to track changes
   *
   * @api public
   */
  static observe (target, options = {}, _handler = noop) {
    // Avoid observe twice... Just return the target
    if (ProxyObserver.is(target)) return target

    const { deep, patch } = options = Object.assign({}, ProxyObserver.observeOptions, options)

    const observer = new ProxyObserver(target)

    // Indexed by target
    __observers__.set(target, observer)

    function notify (change) {
      _handler(change)
      observer.dispatch(change)
    }

    if (patch) {
      const mapOrSet = isMapOrSet(target)

      if (mapOrSet || isWeakMapOrSet(target)) {
        (mapOrSet ? patchFull : patchWeak)(target, notify, options, ProxyObserver.observe)

        // At this point we're using the patch strategy so we can skip extra proxy observation
        return target
      }
    }

    if (deep) {
      const descriptors = Object.getOwnPropertyDescriptors(target)

      // Start deep observing
      for (const key in descriptors) {
        const descriptor = descriptors[key]

        if (isDescriptorObservable(descriptor)) {

          // Replace actual value with the observed one
          descriptor.value = ProxyObserver.observe(descriptor.value, options, notify)

          Object.defineProperty(target, key, descriptor)
        }
      }
    }

    const proxy = new Proxy(target, {

      /**
       * 1. Detect sets/additions
       *
       *   In arrays:
       *
       *     array[index] = value
       *     array.push(value)
       *     array.length = length
       *     ...
       *
       *   In objects:
       *
       *     object[key] = value
       *     Object.defineProperty(target, key, descriptor)
       *     Reflect.defineProperty(target, key, descriptor)
       *     ...
       */
      defineProperty (target, key, descriptor) {
        const old = target[key]
        const changed = hasOwn.call(target, key)
        const value = descriptor.get ? descriptor.get() : descriptor.value

        if (deep && isDescriptorObservable(descriptor)) {
          descriptor.value = ProxyObserver.observe(value, options, notify)
        }

        const defined = Reflect.defineProperty(target, key, descriptor)

        if (defined && (!changed || value !== old)) {
          const change = { type: changed ? 'set' : 'add', value, key, target }

          if (changed) change.old = old

          notify(change)
        }

        return defined
      },

      /**
       * 2. Track property deletions
       *
       *   In arrays:
       *
       *     array.splice(index, count, additions)
       *     ...
       *
       *   In objects:
       *
       *     delete object[key]
       *     Reflect.deleteProperty(object, key)
       *     ...
       */
      deleteProperty (target, key) {
        const old = target[key]
        const deleted = hasOwn.call(target, key) && Reflect.deleteProperty(target, key)

        if (deleted) {
          notify({ type: 'delete', old, key, target })
        }

        return deleted
      }
    })

    // Indexed by proxy
    __observers__.set(proxy, observer)

    return proxy
  }

  /**
   * Subscribe to changes
   *
   * @param {Function} subscriber - Function to subscribe
   *
   * @return {ProxyObserver}
   *
   * @api public
   */
  subscribe (subscriber) {
    this.subscribers.add(subscriber)
    return this
  }

  /**
   * Unsubscribe function
   *
   * @param {Function} subscriber - Functions subscribed
   *
   * @return {ProxyObserver}
   *
   * @api public
   */
  unsubscribe (subscriber) {
    this.subscribers.delete(subscriber)
    return this
  }

  /**
   * Dispatch subscribers with given `change`
   *
   * @param {Object} change - Change descriptor
   *
   * @return {ProxyObserver}
   *
   * @api public
   */
  dispatch (change) {
    this.subscribers.forEach(subscriber => {
      subscriber(change, this.target)
    })

    return this
  }
}

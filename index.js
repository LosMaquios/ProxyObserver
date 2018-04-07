/**
 * Internal symbol to annotate proxy values
 *
 * @type {Symbol}
 *
 * @api private
 */
const __SYMBOL__ = Symbol('ProxyObserver')

/**
 * Alias of `Object.prototype.hasOwnProperty`
 *
 * @type {Function}
 *
 * @api private
 */
const hasOwn = Object.prototype.hasOwnProperty

/**
 * Determines whether a given `value` is an object
 *
 * @type {Function}
 *
 * @api private
 */
const isObject = value => value !== null && typeof value === 'object'

/**
 * No-operation
 *
 * @type {Function}
 *
 * @api private
 */
const noop = () => {}

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

    // Annotate target
    Object.defineProperty(target, __SYMBOL__, { value: this })
  }

  /**
   * Gets the `ProxyObserver` from the given `proxy`
   *
   * @param {Proxy} proxy - The proxy itself
   *
   * @return {ProxyObserver}
   *
   * @api public
   */
  static get (proxy) {
    return proxy[__SYMBOL__]
  }

  /**
   * Observe a given `target` to detect changes
   *
   * @param {*} target - The value to be observed
   * @param {boolean=} deep - Indicating whether observing should be deep
   * @param {Function=} handler - Global handler for deep observing
   *
   * @return {Proxy} Proxy to track changes
   *
   * @api public
   */
  static observe (target, deep = true, handler = noop) {
    const observer = new ProxyObserver(target)

    function notify (change) {
      handler(change)
      observer.dispatch(change)
    }

    if (deep) {
      // Start deep observing
      for (const property in target) {
        if (hasOwn.call(target, property)) {
          const value = target[property]

          if (isObject(value)) {
            // Replace actual value with the observed one
            target[property] = ProxyObserver.observe(value, deep, notify)
          }
        }
      }
    }

    return new Proxy(target, {

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
       *     Object.defineProperty(target, property, descriptor)
       *     Reflect.defineProperty(target, property, descriptor)
       *     ...
       */
      defineProperty (target, property, descriptor) {
        const { value } = descriptor

        if (deep && isObject(value)) {
          descriptor.value = ProxyObserver.observe(value, deep, handler)
        }

        const old = target[property]
        const changed = hasOwn.call(target, property)

        const defined = Reflect.defineProperty(target, property, descriptor)

        if (defined && (!changed || old !== value)) {
          const change = {
            type: changed ? 'set' : 'add',
            value, property, target
          }

          if (changed) change.old = old

          notify(change)
        }

        return defined
      },

      /**
       * 3. Track property deletions
       *
       *   In arrays:
       *
       *     array.splice(index, count, additions)
       *     ...
       *
       *   In objects:
       *
       *     delete object[property]
       *     Reflect.deleteProperty(object, property)
       *     ...
       */
      deleteProperty (target, property) {
        const old = target[property]
        const deleted = hasOwn.call(target, property) && Reflect.deleteProperty(target, property)

        if (deleted) {
          notify({ type: 'delete', old, property, target })
        }

        return deleted
      }
    })
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
      subscriber(change)
    })

    return this
  }
}

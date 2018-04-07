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
const { hasOwnProperty } = Object.prototype

export default class ProxyObserver {

  /**
   * Initializes `ProxyObserver`
   *
   * @param {*} value - Value observed
   *
   * @api public
   */
  constructor (value) {

    /**
     * Value being observed
     *
     * @member {*}
     *
     * @api public
     */
    this.value = value

    /**
     * Subscriber functions
     *
     * @member {Array.<Function>}
     *
     * @api public
     */
    this.subscribers = []

    /**
     * Symbol reference
     *
     * @member {ProxyObserver}
     *
     * @api private
     */
    Object.defineProperty(value, __SYMBOL__, { value: this })
  }

  /**
   * Gets a the `ProxyObserver` from the given `proxy`
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
   * Observe a given `value` to detect changes
   *
   * @param {*} value - The value to be observed
   * @param {Function} handler - Global handler for deep observing
   *
   * @return {Proxy} Proxy to track changes
   *
   * @api public
   */
  static observe (value, handler) {
    const observer = new ProxyObserver(value)

    function notify (...args) {
      handler(...args)
      observer.dispatch(...args)
    }

    // Start deep observing
    for (const property in value) {
      if (hasOwnProperty.call(value, property)) {
        const _value = value[property]

        if (isObject(_value)) {
          // Replace actual value with the observed one
          value[property] = ProxyObserver.observe(_value, handler)
        }
      }
    }

    return new Proxy(value, {

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
       *     ...
       */
      set (...args) {
        const value = args[2]

        if (value !== null && typeof value === 'object') {
          args[2] = ProxyObserver.observe(value, handler)
        }

        Reflect.set(...args)
        notify(...args)

        return true
      },

      /**
       * 2. Catch descriptor sets/addtions
       *
       *   Only in objects:
       *
       *     Object.defineProperty(object, property, descriptor)
       *     ...
       */
      defineProperty (...args) {
        if (Reflect.defineProperty(...args)) {
          notify(...args)
        }

        return true
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
       *     ...
       */
      deleteProperty (target, property) {
        if (Reflect.has(target, property)) {
          Reflect.deleteProperty(target, property)
          notify(target, property)
        }

        return true
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
    this.subscribers.push(subscriber)

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
    this.subscribers.splice(this.subscribers.indexOf(subscriber), 1)

    return this
  }

  /**
   * Dispatch subscribers with given `args`
   *
   * @param {*...} args - Args to dispatch with
   *
   * @return {ProxyObserver}
   *
   * @api public
   */
  dispatch (...args) {
    this.subscribers.forEach(subscriber => {
      subscriber(...args)
    })

    return this
  }
}

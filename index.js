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
 * Determines whether a given `value` is observable
 *
 * @type {Function}
 *
 * @api private
 */
const isObservable = value => Object.prototype.toString.call(value) === '[object Object]' || Array.isArray(value)

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

      // By default, we compare the stringified raw values to avoid observed ones
      // and conflicts between proxy object structures.
      compare (value, old/*, property, target*/) {
        return JSON.stringify(value) !== JSON.stringify(old)
      }
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
    return isObservable(value) && hasOwn.call(value, __SYMBOL__)
  }

  /**
   * Gets the `ProxyObserver` from the given `proxy`
   *
   * @param {Proxy} proxy - The proxy itself
   *
   * @return {ProxyObserver}
   *
   * @throws An error will thrown when the given proxy is not observed
   *
   * @api public
   */
  static get (proxy) {
    if (!ProxyObserver.is(proxy)) {
      throw new Error('The given `proxy` is not a ProxyObserver')
    }

    return proxy[__SYMBOL__]
  }

  /**
   * Observe a given `target` to detect changes
   *
   * @param {*} target - The value to be observed
   * @param {Object} [options] - An object of options
   * @param {boolean} [options.deep] - Indicating whether observation should be deep
   * @param {Function} [options.compare] - Compare values with a function to dispatch changes
   * @param {Function} [_handler] - Internal global handler for deep observing
   *
   * @return {Proxy} Proxy to track changes
   *
   * @api public
   */
  static observe (target, options = {}, _handler = noop) {
    // Avoid observe twice... Just return the target
    if (ProxyObserver.is(target)) return target

    const { deep, compare } = Object.assign({}, ProxyObserver.observeOptions, options)

    const observer = new ProxyObserver(target)

    // Annotate target
    Object.defineProperty(target, __SYMBOL__, { value: observer })

    function notify (change) {
      _handler(change)
      observer.dispatch(change)
    }

    if (deep) {
      // Start deep observing
      for (const property in target) {
        if (hasOwn.call(target, property)) {
          const value = target[property]

          if (isObservable(value)) {
            // Replace actual value with the observed one
            target[property] = ProxyObserver.observe(value, options, notify)
          }
        }
      }
    }

    return new Proxy(target, {
      // We can implement something like (get trap):
      // https://stackoverflow.com/a/43236808

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
        const old = target[property]
        const changed = hasOwn.call(target, property)

        if (deep && isObservable(value)) {
          descriptor.value = ProxyObserver.observe(value, options, notify)
        }

        const defined = Reflect.defineProperty(target, property, descriptor)

        if (defined && (!changed || compare(value, old, property, target))) {
          const change = { type: changed ? 'set' : 'add', value, property, target }

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
      subscriber(change, this.target)
    })

    return this
  }
}

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.ProxyObserver = factory());
}(this, (function () { 'use strict';

  /**
   * Alias of `Object.prototype.hasOwnProperty`
   *
   * @type {Function}
   *
   * @api private
   */
  const hasOwn = Object.prototype.hasOwnProperty;

  /**
   * Determines whether a given `value` is observable
   *
   * @type {Function}
   *
   * @api private
   */
  const isObservable = value => typeof value === 'object';

  /**
   *
   * @param {*} value
   *
   * @return {boolean}
   */
  const isMapOrSet = value => value instanceof Map || value instanceof Set;

  /**
   *
   * @param {*} value
   *
   * @return {boolean}
   */
  const isWeakMapOrSet = value => value instanceof WeakMap || value instanceof WeakSet;

  /**
   * No-operation
   *
   * @type {Function}
   *
   * @api private
   */
  const noop = () => {};

  /**
   * Patch a given `target`
   *
   * @param {Map|Set} target
   * @param {Function} notify
   * @param {Object} options
   * @param {Function} observe
   *
   * @return void
   *
   * @api private
   */
  function patchFull (target, notify, options, observe) {

    // Try to patch initial values preserving order
    if (options.deep && target.size) {
      const entries = Array.from(target);

      function tryObserve (value) {
        return isObservable(value) ? observe(value, options, notify) : value
      }

      target.clear();

      if (target.add) {
        for (const value of entries) {
          target.add(tryObserve(value));
        }
      } else {
        for (const [key, value] of entries) {
          target.set(tryObserve(key), tryObserve(value));
        }
      }
    }

    patchWeak(target, notify, options, observe);
    patchFn(target, 'clear', genProxyClear(notify));
  }

  /**
   * Patch a given weak `target`
   *
   * @param {WeakMap|WeakSet} target
   * @param {Function} notify
   * @param {Object} options
   * @param {Function} observe
   *
   * @return void
   *
   * @api private
   */
  function patchWeak (target, notify, options, observe) {
    const isSet = 'add' in target;

    patchFn(
      target,
      isSet ? 'add' : 'set',
      (isSet ? genProxyAdd : genProxySet)(notify, value => {
        return options.deep && isObservable(value)
          ? observe(value, options, notify)
          : value
      })
    );

    patchFn(target, 'delete', genProxyDelete(notify));
  }

  /**
   * @api private
   */
  const genProxyAdd = (notify, tryObserve) => _add => function proxyAdd (value) {
    if (!this.has(value)) {
      _add.call(this, tryObserve(value));

      notify({ type: 'add', value, target: this });
    }

    return this
  };

  /**
   * @api private
   */
  const genProxySet = (notify, tryObserve) => _set => function proxySet (key, value) {
    const isOld = this.has(key);
    const old = isOld && this.get(key);

    if (!isOld || old !== value) {
      const change = { type: isOld ? 'set' : 'add', key, value, target: this };

      if (isOld) change.old = old;

      _set.call(this, tryObserve(key), tryObserve(value));

      notify(change);
    }

    return this
  };

  /**
   * @api private
   */
  const genProxyDelete = notify => _delete => function proxyDelete (key) {
    const old = this.get(key);
    const removed = _delete.call(this, key);

    if (removed) {
      notify({ type: 'delete', old, key, target: this });
    }

    return removed
  };

  /**
   * @api private
   */
  const genProxyClear = notify => _clear => function proxyClear () {
    if (target.size) {

      // Make a copy of the original object
      const old = new this.constructor(Array.from(this));

      _clear.call(this);

      notify({ type: 'clear', old, target: this });
    }
  };

  /**
   * Patch method from a given `target`
   *
   * @param {WeakSet|WeakMap|Set|Map} target
   * @param {string} method
   * @param {Function} fn
   *
   * @return void
   *
   * @api private
   */
  function patchFn (target, method, fn) {
    const original = target[method];

    Object.defineProperty(target, method, {
      value: fn(original)
    });
  }

  /**
   * Store observers internally
   *
   * @type {WeakMap}
   *
   * @api private
   */
  const __observers__ = new WeakMap();

  class ProxyObserver {

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
      this.target = target;

      /**
       * Subscriber functions
       *
       * @member {Set.<Function>}
       *
       * @api public
       */
      this.subscribers = new Set();
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

      const { deep, patch } = options = Object.assign({}, ProxyObserver.observeOptions, options);

      const observer = new ProxyObserver(target);

      // Indexed by target
      __observers__.set(target, observer);

      function notify (change) {
        _handler(change);
        observer.dispatch(change);
      }

      if (patch) {
        const mapOrSet = isMapOrSet(target);

        if (mapOrSet || isWeakMapOrSet(target)) {
          (mapOrSet ? patchFull : patchWeak)(target, notify, options, ProxyObserver.observe);

          // At this point we're using the patch strategy so we can skip extra proxy observation
          return target
        }
      }

      if (deep) {

        // Start deep observing
        for (const key in target) {
          if (hasOwn.call(target, key)) {
            const value = target[key];

            if (isObservable(value)) {

              // Replace actual value with the observed one
              target[key] = ProxyObserver.observe(value, options, notify);
            }
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
          const { value } = descriptor;
          const old = target[key];
          const changed = hasOwn.call(target, key);

          if (deep && isObservable(value)) {
            descriptor.value = ProxyObserver.observe(value, options, notify);
          }

          const defined = Reflect.defineProperty(target, key, descriptor);

          if (defined && (!changed || value !== old)) {
            const change = { type: changed ? 'set' : 'add', value, key, target };

            if (changed) change.old = old;

            notify(change);
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
          const old = target[key];
          const deleted = hasOwn.call(target, key) && Reflect.deleteProperty(target, key);

          if (deleted) {
            notify({ type: 'delete', old, key, target });
          }

          return deleted
        }
      });

      // Indexed by proxy
      __observers__.set(proxy, observer);

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
      this.subscribers.add(subscriber);
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
      this.subscribers.delete(subscriber);
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
        subscriber(change, this.target);
      });

      return this
    }
  }

  return ProxyObserver;

})));

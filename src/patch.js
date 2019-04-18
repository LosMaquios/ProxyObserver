import { isObservable } from './utils'

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
export function patchFull (target, notify, options, observe) {

  // Try to patch initial values preserving order
  if (options.deep && target.size) {
    const entries = Array.from(target)

    function tryObserve (value) {
      return isObservable(value) ? observe(value, options, notify) : value
    }

    target.clear()

    if (target.add) {
      for (const value of entries) {
        target.add(tryObserve(value))
      }
    } else {
      for (const [key, value] of entries) {
        target.set(tryObserve(key), tryObserve(value))
      }
    }
  }

  patchWeak(target, notify, options, observe)
  patchFn(target, 'clear', genProxyClear(notify))
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
export function patchWeak (target, notify, options, observe) {
  const isSet = 'add' in target

  patchFn(
    target,
    isSet ? 'add' : 'set',
    (isSet ? genProxyAdd : genProxySet)(notify, value => {
      return options.deep && isObservable(value)
        ? observe(value, options, notify)
        : value
    })
  )

  patchFn(target, 'delete', genProxyDelete(notify))
}

/**
 * @api private
 */
const genProxyAdd = (notify, tryObserve) => _add => function proxyAdd (value) {
  if (!this.has(value)) {
    _add.call(this, tryObserve(value))

    notify({ type: 'add', value, target: this })
  }

  return this
}

/**
 * @api private
 */
const genProxySet = (notify, tryObserve) => _set => function proxySet (key, value) {
  const isOld = this.has(key)
  const old = isOld && this.get(key)

  if (!isOld || old !== value) {
    const change = { type: isOld ? 'set' : 'add', key, value, target: this }

    if (isOld) change.old = old

    _set.call(this, tryObserve(key), tryObserve(value))

    notify(change)
  }

  return this
}

/**
 * @api private
 */
const genProxyDelete = notify => _delete => function proxyDelete (key) {
  const old = this.get(key)
  const removed = _delete.call(this, key)

  if (removed) {
    notify({ type: 'delete', old, key, target: this })
  }

  return removed
}

/**
 * @api private
 */
const genProxyClear = notify => _clear => function proxyClear () {
  if (target.size) {

    // Make a copy of the original object
    const old = new this.constructor(Array.from(this))

    _clear.call(this)

    notify({ type: 'clear', old, target: this })
  }
}

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
  const original = target[method]

  Object.defineProperty(target, method, {
    value: fn(original)
  })
}

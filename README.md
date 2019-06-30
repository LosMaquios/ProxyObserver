# ProxyObserver

  Observe your data changes easily with the [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) power.

## Usage and installation

  Importing from cdn:

```js
import ProxyObserver from 'https://cdn.jsdelivr.net/gh/LosMaquios/ProxyObserver/index.js'

const person = {
  name: 'Camilo Rodríguez'
}

const proxy = ProxyObserver.observe(person)
const observer = ProxyObserver.get(proxy)

observer.subscribe(change => {
  switch (change.type) {
    case 'add':
      console.log(`Property '${change.key}' added`)
      break
    case 'set':
      console.log(`Property '${change.key}' changed`)
      break
    case 'delete':
      console.log(`Property '${change.key}' deleted`)
      break
  }
})

// Changing
proxy.name = 'Raphael Martinez'

// Adding
proxy.age = 20

// Deleting
delete proxy.age

/*

  Output:

    Property 'name' changed
    Property 'age' added
    Property 'age' deleted

*/
```

## Patch strategy

  The patch strategy allow us to observe `WeakMap`, `Map`, `WeakSet` and `Set` native objects.

```js
const map = new Map()

map.set('non-observed', 'value')

// it's not necessary to assign the observed result value to a variable since we patch the `map` instance
// Note: The patch strategy ONLY patch (Weak)Map/Set objects
ProxyObserver.observe(map, {
  patch: true /* <- important to enable patch strategy */
})

const observer = ProxyObserver.get(map)

observer.subscribe(change => {
  if (change.type === 'set') {
    console.log(`map[${change.key}] = ${change.value}`)
  }
})

map.set('observed', 'value')

/**
 * Output: map[observed] = value
 */
```

## API Documentation

### Convenience properties

<details>
  <summary>
    ProxyObserver<strong>.observeOptions</strong>
  </summary>
  <br>

  Contains the defaults options passed to `ProxyObserver.observe` method

  **Type:** `Object`

  **Properties:**

  - **deep**: `true` (enable deep observing by default).
  - **patch**: `false` (disable patch-strategy by default).
</details>

### Convenience methods

<details>
  <summary>
    ProxyObserver<strong>.observe(value[, options])</strong>
  </summary>
  <br>

  Observes the given `value` and optionally you can pass `options`

  **Arguments:**

  - [`any`] **value**: Value to be observed
  - [`Object`] **options**: An object containing the following options (defaults to [`observeOptions`](#observeOptions))
    - [`boolean`] **deep**: A flag to enable deep observing (defaults to `true`)
    - [`boolean`] **patch**: Allow patching (Weak)Map/Set objects to detect changes (defaults to `false`)

  **Returns:** A `Proxy` object which dispatch subscribers on changes.

  **Example:** [See here](#usage-and-installation)
</details>

<details>
  <summary>
    ProxyObserver<strong>.get(value)</strong>
  </summary>
  <br>

  Gets the `ProxyObserver` instance from an observed `value`

  **Arguments:**

  - [`any`] **value**: Value being observed. It could be the value itself or the proxy
  returned by calling [`ProxyObserver.get()`](#ProxyObserver-get) static method.

  **Returns:** A `ProxyObserver` instance, ready to subscribe or dispatch changes.

  **Example:**

  ```js
    const proxy = ProxyObserver.observe(obj/*, options */)

    const observer = ProxyObserver.get(proxy)

    // or ProxyObserver.get(obj)
  ```
</details>

<details>
  <summary>
    ProxyObserver<strong>.is(value)</strong>
  </summary>
  <br>

  Determines whether a given `value` is observed.

  **Arguments:**

  - [`any`] **value**: Possible value being observed.

  **Returns:** `true` whether the given `value` is observed, otherwise `false`.

  **Example:**

  ```js
    const proxy = ProxyObserver.observe(obj/*, options */)

    ProxyObserver.is(proxy) // Returns `true`
    ProxyObserver.is(obj) // Returns `true`
    ProxyObserver.is({ non: 'observed' }) // Returns `false`
  ```
</details>

### The `ProxyObserver` instance

<details>
  <summary>
    <strong>new ProxyObserver(target)</strong>
  </summary>
  <br>

  Creates a new ProxyObserver instance with the value being observed

  **Arguments:**

  - [`any`] **target**: Value being observed.
</details>

<details>
  <summary>
    observer<strong>.subscribe(subscriber)</strong>
  </summary>
  <br>

  Attach a new `subscriber` which will be called when a `change` is dispatched.

  **Arguments:**

  - [`Function`] **subscriber**: The subscriber function itself.

  **Returns:** The `ProxyObserver` instance.
</details>

<details>
  <summary>
    observer<strong>.unsubscribe(subscriber)</strong>
  </summary>
  <br>

  Detach the given `subscriber`.

  **Arguments:**

  - [`Function`] **subscriber**: Subscriber to be detached.

  **Returns:** The `ProxyObserver` instance.
</details>

<details>
  <summary>
    observer<strong>.dispatch(change)</strong>
  </summary>
  <br>

  Dispatch a given `change` descriptor.

  **Arguments:**

  - [`Object`] **change**: Descriptor to be dispatched.

  **Returns:** The `ProxyObserver` instance.
</details>

### The change descriptor

  A change descriptor is dispatched according to the following interface:

```ts
interface ChangeDescriptor {
  type: 'add' | 'set' | 'delete' | 'clear' // <- special type for Set/Map objects
  old?: any
  value?: any
  key?: any
  target: any
}
```

## Caveats

  1. Take in mind that `ProxyObserver` is a **value** change detector,
  not a descriptor change detector. So, that means you can't detect changes
  for something like this:

```js
proxy.key = 'value'

// This doesn't dispatch changes
Object.defineProperty(proxy, 'key', { value: 'value', enumerable: false })
```

  2. Calling methods on observed arrays could dispatch many changes
  (and different types of them). For example:

```js
// Dispatch changes for 'length' property increment and index assignation
proxy.push('value')

// Many changes for values swaping
proxy.sort()
proxy.reverse()

// ... (check for yourself)
proxy.splice(1, 2, 'another value')
```

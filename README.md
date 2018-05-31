# ProxyObserver

  Observe your data changes easily with the [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) power.

  **Note:** `ProxyObserver` exists mostly for reactive libraries which
  needs to keep track data changes. (e.g. `Vue` to perform DOM
  updates on `data` mutations).

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
      console.log(`Property '${change.property}' added`)
      break
    case 'set':
      console.log(`Property '${change.property}' changed`)
      break
    case 'delete':
      console.log(`Property '${change.property}' deleted`)
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

## API Documentation

<details>
  <summary>
    ProxyObserver<strong>.observe(value[, options])</strong>
  </summary>
  <br>

  Observes the given `value` and optionally pass `options`

**Arguments:**

  - [`any`] **value**: Value to be observed
  - [`Object`] **options**: An object containing the following options (defaults to [`observeOptions`](#observeOptions))
    - [`boolean`] **deep**: A flag to enable deep observing (defaults to `false`)
    - [`Function`] **compare**: A function to compare new values (defaults to [`observeOptions.compare`](#observeOptions-compare))

**Returns:** A `Proxy` object which dispatch subscribers on changes.

```js
  const obj = { key: 'value' }

  const proxy = ProxyObserver.observe(obj, {
    deep: false,
    compare (value, old, property, target) {
      // Always dispatch changes
      return true
    }
  })
```
</details>

<details>
  <summary>
    ProxyObserver<strong>.get(proxy)</strong>
  </summary>

  <p>
    Gets the `ProxyObserver` instance from an observed `value`
  </p>
</details>

<details>
  <summary>
    ProxyObserver<strong>.is(proxy)</strong>
  </summary>

  <p>
    Determines whether a given `proxy` is created from a `ProxyObserver`
  </p>
</details>

### The `ProxyObserver` class

<details>
  <summary>
    <strong>new ProxyObserver(value)</strong>
  </summary>

  <p>
    Creates a new ProxyObserver instance with the value being observed
  </p>
</details>

<details>
  <summary>
    observer<strong>.subscribe(subscriber)</strong>
  </summary>

  <p>
    Creates a new ProxyObserver instance with the value being observed
  </p>
</details>

<details>
  <summary>
    observer<strong>.unsubscribe(subscriber)</strong>
  </summary>

  <p>
    Creates a new ProxyObserver instance with the value being observed
  </p>
</details>

<details>
  <summary>
    observer<strong>.dispatch(change)</strong>
  </summary>

  <p>
    Creates a new ProxyObserver instance with the value being observed
  </p>
</details>

### The `change` descriptors

#### `add` descriptor

```ts
interface AddDescriptor {
  type: 'add'
  value: any
  property: string
  target: any
}
```

#### `set` descriptor

```ts
interface SetDescriptor {
  type: 'set'
  old: any
  value: any
  property: string
  target: any
}
```

#### `delete` descriptor

```ts
interface DeleteDescriptor {
  type: 'delete'
  old: any
  property: string
  target: any
}
```

## Caveats

  1. Take in mind that `ProxyObserver` is a **value** change detector, not a descriptor change detector. So, that means you can't detect changes for
  something like this:

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

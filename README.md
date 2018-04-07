# ProxyObserver

  Observe your data changes easily with the [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) power.

## Usage and installation

  Importing from raw git (for now):

```js
import ProxyObserver from '<waiting-url>'

const person = {
  name: 'Camilo Rodríguez'
}

const proxy = ProxyObserver.observe(person, () => {
  console.log('Changing property')
})

proxy.name = 'Raphael Martinez'
proxy.age = 20

// Output: (2) Changing property
```

## API Documentation

<details>
  <summary>
    ProxyObserver<strong>.observe(value[, handler])</strong>
  </summary>

  <p>
    Observes the given value and pass an optional handler
  </p>
</details>

<details>
  <summary>
    ProxyObserver<strong>.get(proxy)</strong>
  </summary>

  <p>
    Gets the `ProxyObserver` instance from an observed `value`
  </p>
</details>

### The `ProxyObserver` instance

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
    observer<strong>.dispatch(...args)</strong>
  </summary>

  <p>
    Creates a new ProxyObserver instance with the value being observed
  </p>
</details>

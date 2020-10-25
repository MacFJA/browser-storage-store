# Browser Storage Store

This library is a set of [Store](https://svelte.dev/docs#Store_contract) that can use your browser Storage API to persist data.

It was create with Svelte in mind but can be used in any Javascript application. 

## Installation

```
npm install @macfja/browser-storage-store
```

## Usage

There are 5 stores: 2 generic and 3 specialized.

- `storageApiStore`: Generic store to save data in a [Storage Api](https://developer.mozilla.org/en-US/docs/Web/API/Storage) compatible storage.
- `persistentAsyncStorage`: Generic store to save data from a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- `localStore`: Create a store with the browser [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- `sessionStore`: Create a store with the browser [SessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- `persistentFetchStore`: Create a store from a [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)

### Svelte

```html
<script>
    import { localStore } from "@macfja/browser-storage-store"

    let name = localStore("name", "John")
</script>

<h1>Hello, {$name}!</h1>

My name is: <input bind:value="{$name}" />

<hr />
<p>
    Any changes of <code>$name</code> will be keep
    between page reload, and between any page of the same website.
</p>
```

### Generic Javascript

```javascript
import { localStore } from "@macfja/browser-storage-store"

let name = localStore("name", "John")

// ... further in the code
let unsubscribeAlert = name.subscribe(newName => alert("Your name is: " + newName))
// an alert message will appear with "Your name is: John"

// ... further in the code
name.set("Jeanne Doe")
// an alert message will appear with "Your name is: Jeanne Doe"

// ... further in the code
const i_want_to_quit_the_app = () => {
    unsubscribeAlert()
}
```

### PersistentStore

```html
<script>
import { persistentFetchStore } from "@macfja/browser-storage-store"

let time = persistentFetchStore("http://worldtimeapi.org/api/timezone/Europe/Paris")

const updateTime = () => {
  time.invalidate()
}
</script>

The last time the date was refresh is: {$time.datetime} <button on:click="{updateTime}">Do it now</button>
```

```html
<script>
    import { persistentFetchStore } from "@macfja/browser-storage-store"

    let cart = persistentFetchStore("/myApp/user/cart")

    const addProduct = productId => {
        // API call to add the product to the shopping cart
        addProductByIdApi(productId)
            .then(() => cart.invalidate()) 
    }
</script>

<button on:click="{() => addProduct(Math.floor(Math.random() * 30))}">Add a random product</button>

<ul>
    {#each $cart as item}
        <li>{item.name} (SKU: {item.sku}) &times;{item.qty}</li>
    {:else}
        <li><em>You cart is empty</em></li>
    {/each}
</ul>
```

## Contributing

Contributions are welcome. Please open up an issue or create PR if you would like to help out.

Read more in the [Contributing file](CONTRIBUTING.md)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
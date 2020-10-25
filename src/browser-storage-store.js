/*
 * Copyright MacFJA
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Re implementation of Svelte get_store_value.
 * Get the current value of a store
 * @internal
 * @private
 * @api
 * @param {StorageApiStore|PersistentStore} store The store to read
 * @return {*}
 */
function get_store_value(store) {
    let value
    store.subscribe(v => value = v)()
    return value
}

/**
 * @typedef {Object} StorageApiStore
 * @property {StoreSetter} set The a new value in the storage
 * @property {StoreSubscription} subscribe Subscribe to the store data changes
 * @property {function()} delete Remove the data from the store and the storage
 */

/**
 * @typedef {Object} PersistentStore
 * @property {StoreSubscription} subscribe Subscribe to the store data changes
 * @property {function()} delete Remove the data from the store and the storage
 * @property {function()} invalidate Invalidate the data in the storage and relaunch a synchronization
 */

/**
 * @typedef {function} StoreSetter
 * @param {*} value The new value to set
 */
/**
 * @typedef {function} StoreSubscription
 * @param {*} value The new value
 * @return {function()} The function to unsubscribe to the store
 */

/**
 * Create a Store (spec: [Svelte Store Contract](https://svelte.dev/docs#Store_contract)) using [Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage)
 * @param {String} keyName The name of the data key
 * @param {*} initialValue The store value if the storage is empty
 * @param {Storage} storage The Storage to use
 * @return {StorageApiStore}
 */
export const storageApiStore = (keyName, initialValue, storage) => {
    const getValue = name => {
        let rawValue = storage.getItem(name)
        if (rawValue === null) {
            return null
        }
        return JSON.parse(rawValue)
    }
    const setValue = (name, value) => storage.setItem(name, JSON.stringify(value))
    const removeValue = name => storage.removeItem(name)
    let subscriptions = []
    let key = "svelte-store-" + keyName

    if (initialValue !== null && getValue(key) === null) {
        setValue(key, initialValue)
    }

    return {
        subscribe: (subscriber) => {
            subscriptions.push(subscriber)
            subscriber(getValue(key))

            return () => {
                subscriptions = subscriptions.filter(item => item !== subscriber)
            }
        },
        set: (value) => {
            setValue(key, value)
            subscriptions.forEach(subscriber => { subscriber(value) })
        },
        delete: () => {
            removeValue(key)
        }
    }
}
/**
 * Create the persistent store with data from a Promise
 * @param {String} keyName The name of the data key
 * @param {function(): Promise<*>} getterPromise The function that generate the promise to use
 * @return {PersistentStore}
 */
export const persistentAsyncStore = (keyName, getterPromise) => {
    let store = localStore(keyName, null)
    const update = () => {
        getterPromise().then(response => {
            store.set(response)
        })
    }
    let initialValue = get_store_value(store)

    if (initialValue === null) {
        update(store)
    }

    return {
        subscribe: store.subscribe,
        invalidate: update,
        delete: store.delete
    }
}
/**
 * Create a Store (spec: [Svelte Store Contract](https://svelte.dev/docs#Store_contract)) that use browser [LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
 * @param {String} keyName The name of the data key
 * @param {*} initialValue The store value if the storage is empty
 * @return {StorageApiStore}
 */
export const localStore = (keyName, initialValue) => storageApiStore(keyName, initialValue, window.localStorage)
/**
 * Create a Store (spec: [Svelte Store Contract](https://svelte.dev/docs#Store_contract)) that use browser [SessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
 * @param {String} keyName The name of the data key
 * @param {*} initialValue The store value if the storage is empty
 * @return {StorageApiStore}
 */
export const sessionStore = (keyName, initialValue) => storageApiStore(keyName, initialValue, window.sessionStorage)
/**
 * Create a persistent Fetch store.
 * The result of the fetch (GET) is save in the browser localStorage. It can be invalidated to be refreshed
 * @param {String} url The URL to call (GET)
 * @param {String|null} [forceType] The data type of the response.<br/>
 *                                  Set to `"json"` to parse a JSON, `"text"` to have the text value, anything else to have the Blob.<br />
 *                                  If the data type is `null` or undefined, then the type issued by the response is used.
 * @return {PersistentStore}
 */
export const persistentFetchStore = (url, forceType) => {
    return persistentAsyncStore(url, () => {
        return fetch(url).then(response => {
            const responseDataType = response.headers.get("content-type") || "binary"
            const finalDataType = forceType || responseDataType
            if (finalDataType.includes("json")) {
                return response.json()
            } else if (finalDataType.includes("text")) {
                return response.text()
            }
            return response.blob()
        })
    })
}
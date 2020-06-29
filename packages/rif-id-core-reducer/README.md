<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-core-reducer</code></h3>
<p align="middle">
    RIF Identity - Core reducer
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-core-reducer">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-core-reducer.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-core-reducer
```

## Features

This reducer handles the state of RIF Identity core module.

### Identity providers

Store different identity providers, used to digitally sign messages.

#### Mnemonic provider

- Stores a mnemonic phrase

## Usage

Setup the store:

```javascript
import { configureStore } from '@reduxjs/toolkit'
import identityReducer from '@rsksmart/rif-id-core-reducer'

const store = configureStore({
  reducer: identityReducer
})
```

Add providers:

```javascript
import { addProvider } from '@rsksmart/rif-id-core-reducer/identityProvider'

const mnemonic1 = 'arctic element road type cotton window uncover vicious goat puppy dune dragon'
const mnemonic2 = 'drip reopen mesh throw correct current smile gossip child display come stove rice camera globe'

store.dispatch(addProvider({
  name: 'mnemonic1',
  args: {
    mnemonic: mnemonic1
  }
}))

store.dispatch(addProvider({
  name: 'mnemonic2',
  args: {
    mnemonic: mnemonic2
  }
}))
```

Update them:

```javascript
import { changeProvider } from '@rsksmart/rif-id-core-reducer/identityProvider'

store.dispatch(addProvider({
  name: 'mnemonic2',
  args: {
    mnemonic: 'belt diet dutch eternal include super grant hard donkey artwork brick floor'
  }
}))
```

Remove provider:

```javascript
import { removeProvider } from '@rsksmart/rif-id-core-reducer/identityProvider'

store.dispatch(removeProvider({
  name: 'mnemonic2',
}))
```

Set a provider as default:

```javascript
import { setDefaultProvider } from '@rsksmart/rif-id-core-reducer/identityProvider'

store.dispatch(setDefaultProvider({
  name: 'mnemonic2',
}))
```

Some accessors:

```javascript
import {
  hasProviders, hasProviderByName, getProviderNames, getDefaultProvider, getProviderByName
} from '@rsksmart/rif-id-core-reducer/identityProvider'

hasProviders(store.state) // true
hasProviderByName(store.state, 'mnemonic1') // true
getProviderNames(store.state) // ['mnemonic1', 'mnemonic2']
getDefaultProvider(store.state) // { type: 'mnemonic', args: { mnemonic: '...' } }
getProviderByName(store.state, 'mnemonic1') // { type: 'mnemonic', args: { mnemonic: '...' } }
```

## Extend

Identity provider interface is designed to add other kind of providers to digitally sign messages:

- Add hardware wallets as identity providers

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- Redux.js: https://redux.js.org/
- Redux.js toolkit: https://redux-toolkit.js.org/

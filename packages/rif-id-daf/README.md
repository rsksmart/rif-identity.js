<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-daf</code></h3>
<p align="middle">
    RIF Identity - DAF
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-daf">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-daf.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-daf
```

Extensions for uPort DAF agent.

## Features

### Support for RIF Identity key model

uPort DAF provides an _Identity provider_ module that is responsible for the creation of keys and derivation of the respective identity. Each time an identity is created, a new private key is generated. RIF model proposes to use deterministic derivation for private keys, making all the identities associated with a single mnemonic phrase.

The model uses a wallet account like derivation for identity keys:
1. Create a mnemonic phrase to derive identities from
2. Use BIP32 to derive private keys using `TBD` derivation path

For a better developer experience the extension also provides BIP-44 support. Use mnemonic phrase instead of hex keys.

To use this interface we provide:
1. New ORM Entity: `IdentityMnemonic`. Now used to store one single mnemonic.
2. `SeedStore` class - interface to store a seed
3. `RIFIdKeyManagementSystem` class - wrapper for a `daf` `AbstractKeyManagementSystem` - responsible for creating private keys derived from the mnemonic's seed.
4. `RIFIdentityProvider` class - Extension for `daf` `IdentityProvider` enabling to import a mnemonic

All this modules can be plugged to uPort agent as explained in [usage](#usage) to provide uPort agent of this capabilities.

> The identity recovery model is **to be defined**

## Usage

To setup a DAF agent using RIF identity provider implementation:

```typescript
import { Connection } from 'typeorm'
import { KeyStore, IdentityStore, Agent } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium' // change for daf-react-native-libsodioum for React Native support
import { Entities, MnemonicStore, RIFIdKeyManagementSystem, RIFIdentityProvider } from '@rsksmart/rid-id-daf'

const dbConnection = createConnection({
  type: 'sqlite',
  database: 'rif-identity.sqlite',
  entities: [...Entities, ...DAFEntities],
  logging: false,
  synchronize: true
})

// key store
const secretKey = '0f3c04d7416607ba306997f9fd1920474aff39beb23b847da5c21215076cc9b3' // set your own secret key
const secretBox = new SecretBox(secretKey)
const keyStore = new KeyStore(dbConnection, secretBox)
const mnemonicStore = new MnemonicStore(dbConnection, secretBox)

// key management system
const keyManagementSystem = new KeyManagementSystem(keyStore)
const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, keyStore, mnemonicStore)

// rif identity provider
const identityStore = new IdentityStore('rsk-testnet-ethr', dbConnection)

const rifIdentityProvider = new RIFIdentityProvider({
    kms: rifIdKeyManagementSystem,
    identityStore,
    network: 'rsk',
    rpcUrl: 'http://localhost:8545'
})

const agent = new Agent({
    dbConnection,
    identityProviders: [rifIdentityProvider],
    didResolver: null
})

const mnemonic = generateMnemonic(12)

await rifIdentityProvider.importMnemonic(mnemonic)

const identity = await agent.identityManager.createIdentity()
```

## Extend

- Enable multiple mnemonics

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- uPort DAF: https://github.com/uport-project/daf

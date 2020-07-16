<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-daf</code></h3>
<p align="middle">
    RIF Identity - DAF
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-ethr-did">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-ethr-did.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-daf
```

Extensions for uPort DAF agent.

## Features

### Support for RIF Identity key model

uPort DAF provides an _Identity provider_ module that is responsible for the creation of keys and derivation of the respective identity. Each time an identity is created, a new private key is generated. RIF model proposes to use deterministic derivation for private keys, making all the identities associated with a single seed.

The model uses a wallet account like derivation for identity keys:
1. Create a seed to derive identities from
2. Use BIP32 to derive private keys using `TBD` derivation path

For a better developer experience the extension also provides BIP-44 support. Use mnemonic phrase instead of hex keys.

To use this interface we provide:
1. New ORM Entity: `Seed`. Now used to store one single mnemonic.
2. `SeedStore` class - interface to store a seed
3. `RIFIdKeyManagementSystem` class - wrapper for a `daf` `AbstractKeyManagementSystem` - responsible for creating private keys derived from the mnemonic's seed.
4. `RIFIdentityProvider` class - Extension for `daf` `IdentityProvider` enabling to import a mnemonic

All this modules can be plugged to uPort agent as explained in [usage](#usage) to provide uPort agent of this capabilities.

> The identity recovery model is **to be defined**

## Usage

To setup a DAF agent using RIF identity provider implementation:

```typescript
import { createConnection } from 'typeorm'
import { Entities as DAFEntities, KeyStore, IdentityStore, Agent } from 'daf-core'
import { SecretBox, KeyManagementSystem } from 'daf-libsodium'
export { Entities, IdentitySeed, RIFIdentityProvider, RIFIdKeyManagementSystem, SeedStore } from '@rsksmart/rif-id-daf'
import { generateMnemonic } from '@rsksmart/rif-id-mnemonic'

const connection = createConnection({
  type: 'sqlite',
  database: 'sample.sqlite,
  entities: [...Entities, ...DAFEntities],
  logging: false,
  dropSchema: true, // Isolate each test case
  synchronize: true
})

// daf secret box
const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'
const secretBox = new SecretBox(secretKey)

// daf key management system
const keyManagementSystem = new KeyManagementSystem(new KeyStore(connection, secretBox))
// rif seed store
const seedStore = new SeedStore(connection, secretBox)
// rif key management system
const rifIdKeyManagementSystem = new RIFIdKeyManagementSystem(keyManagementSystem, seedStore)

// rif identity provider
const identityProvider = new RIFIdentityProvider({
    kms: rifIdKeyManagementSystem,
    identityStore: new IdentityStore('rsk-testnet-ethr', connection),
    network: 'rsk',
    rpcUrl: 'http://localhost:8545'
})

const agent = new Agent({
    dbConnection: connection,
    identityProviders: [identityProvider],
    didResolver: null,
    /* your options */
})

const mnemonic = generateMnemonic(12)

await identityProvider.importMnemonic(mnemonic)

const identity = await agent.identityManager.createIdentity()
```

## Todo

- Fix test for address digest.

## Extend

- Enable multiple mnemonics

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- uPort DAF: https://github.com/uport-project/daf

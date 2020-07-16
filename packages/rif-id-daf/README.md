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
1. Extension for `daf` `Entities` ORM type, adding two fields to de `Identity` type: seed and last derivation - inheritance used here.
2. Extension for `daf` `Key Store` enabling to store a seed - inheritance used here
3. Extension for `daf-libsodium` and `daf-react-native-libsodium` `Key Management System` enabling to create identities with a stored seed - wrapper used here
4. Extension for `daf-ethr-did` `IdentityProvider` that is responsible for correct derivation and flag las derivation performed done - class override used here.

All this modules can be plugged to uPort agent as explained in [usage](#usage) to provide uPort agent of this capabilities.

> The identity recovery model is **to be defined**

## Usage

```typescript
import { IdentityProvider, }

const identityProvider = new IdentityProvider({
  kms: new KeyManagementSystem(new KeyStore('./store')),
  identityStore: new IdentityStore('rsk', dbConnection),
  network: 'rsk',
  rpcUrl: 'http://localhost:8545'
})
```

## Todo

- Change copy-pasted code in `identity-provider.ts`. PR into uPort DAF to be done.

## Extend

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- uPort DAF: https://github.com/uport-project/daf

<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>rif-id-core</code></h3>
<p align="middle">
    RIF Identity - Core
</p>
<p align="middle">
    <a href="https://badge.fury.io/js/%40rsksmart%2Frif-id-core">
        <img src="https://badge.fury.io/js/%40rsksmart%2Frif-id-core.svg" alt="npm" />
    </a>
</p>

```
npm i @rsksmart/rif-id-core
```

This module includes basic functionality for managing decentralized identities (Ethr DIDs), operating with W3C credentials, interacting with a user-centric Data Vault and operate with RIF communication protocols.

## Features

- Decentralized identities:
    - Create identity
    - Get create identities

## Usage

First of all you need to pick a DB engine ([`typeorm`](https://github.com/typeorm/typeorm)) and setup the [uPort DAF agent](https://github.com/uport-project/daf). The uPort Agent will be responsible for all Identity, W3C and JWT compatible operations. It will also use the database to store information.

- [Setup Database](./docs/setup_database.md)
- [Setup uPort DAF agent](./docs/setup_agent.md)

On top of uPort DAF agent, RIF Identity implements [Redux.js](https://github.com/reduxjs/redux) reducers to seamlessly perform identity and credential operations. The reducers are implemented in _slices_, they can be optionally _plugged_ into an existent Redux.js reducer integrating whole RIF implementations.

- [Integrating Identity reducer](./docs/reducers/identity.md) (mandatory)

## Todo

## Extend

- Identity

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- DID v1.0: https://w3c.github.io/did-core/
- uPort DID: https://github.com/uport-project/ethr-did

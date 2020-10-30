<p align="middle">
  <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>express-did-auth</code></h3>
<p align="middle">
    Express DID Auth
</p>
<p align="middle">
  <a href="https://rsksmart.github.io/rif-identity-docs/ssi/specs/did-auth">
    <img src="https://img.shields.io/badge/-specs-lightgrey" alt="specs" />
  </a>
  <a href="https://rsksmart.github.io/rif-identity-docs/ssi/libraries/express-did-auth">
    <img src="https://img.shields.io/badge/-docs-brightgreen" alt="docs" />
  </a>
  <a href="https://badge.fury.io/js/%40rsksmart%2Fexpress-did-auth">
    <img src="https://badge.fury.io/js/%40rsksmart%2Fexpress-did-auth.svg" alt="npm" />
  </a>
</p>

```
npm i @rsksmart/express-did-auth
```

This module includes a plug and play authentication framework to be used in Express applications, it implements the DID Authentication protocol designed by RIF Identity.

## Features

- **Sign up** flow authenticating user's DID and Verifiable Credentials
- **Sign in** flow authenticating user's DID
- **Authenticate requests** using Express middleware
- **Log out** flow

## Usage

This approach will add the following endpoints to your app:
- GET `/request-signup/:did`
- POST `/signup`
- GET `/request-auth/:did`
- POST `/auth`
- POST `/refresh-token`
- POST `/logout`

```typescript
import express from 'express'
import setupApp from '@rsksmart/express-did-auth'
import { SimpleSigner } from 'did-jwt'

const privateKey = 'c9000722b8ead4ad9d7ea7ef49f2f3c1d82110238822b7191152fbc4849e1891'

const serviceDid = 'did:ethr:rsk:0x8f4438b78c56B48d9f47c6Ca1be9B69B6fAF9dDa'
const serviceSigner = SimpleSigner(privateKey)
const challengeSecret = 'theSuperSecret'
const serviceUrl = 'https://service.com'

const app = express()

const authMiddleware = setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner })(app)

app.get('/not-protected', function (req, res) {
  res.send('This endpoint is not authenticating')
})

app.get('/protected', authMiddleware, function (req, res) {
  res.send('This endpoint is authenticating')
})

const port = process.env.PORT || 5000

app.listen(port, () => logger.info(`My express API with did-auth running in ${port}`))
```

Check out more configuration options and usage details in our [RSK Developers Portal](https://developers.rsk.co/rif/identity/).

## Open work

- Formalize and implement Selective Disclosure request standard schema

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- [Decentralized Identifiers (DIDs) v1.0](https://w3c.github.io/did-core/)
- [Verifiable Credentials Data Model 1.0](https://www.w3.org/TR/vc-data-model/)
- [RFC-1994 - PPP Challenge Handshake Authentication Protocol (CHAP)](https://tools.ietf.org/html/rfc1994)
- [Verifiable Credentials JSON Schema Specification](https://w3c-ccg.github.io/vc-json-schemas/)
- [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [uPort selective disclosure implementation](https://developer.uport.me/flows/selectivedisclosure)

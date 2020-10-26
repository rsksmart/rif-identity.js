<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle"><code>express-did-auth</code></h3>
<p align="middle">
    Express DID Auth
</p>

```
npm i @rsksmart/express-did-auth
```

This module includes a plug and play authentication framework to be used in Express applications, it implements the DID Authentication protocol designed by RIF Identity.

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

app.get('/not-protected', function (req, res) {
  res.send('This endpoint is not authenticating')
})

setupApp({ challengeSecret, serviceUrl, serviceDid, serviceSigner })(app)

app.get('/protected', function (req, res) {
  res.send('This endpoint is authenticating')
})

const port = process.env.PORT || 5000

app.listen(port, () => logger.info(`My express API with did-auth running in ${port}`))
```

Check out more configuration options and usage details in our [RSK Developers Portal](https://developers.rsk.co/rif/identity/).

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- [Decentralized Identifiers (DIDs) v1.0](https://w3c.github.io/did-core/)
- [Verifiable Credentials Data Model 1.0](https://www.w3.org/TR/vc-data-model/)
- [RFC-1994 - PPP Challenge Handshake Authentication Protocol (CHAP)](https://tools.ietf.org/html/rfc1994)
- [Verifiable Credentials JSON Schema Specification](https://w3c-ccg.github.io/vc-json-schemas/)
- [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [uPort selective disclosure implementation](https://developer.uport.me/flows/selectivedisclosure)
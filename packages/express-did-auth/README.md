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

### Plug and play

This approach will add the following endpoints to your app:
- GET `/request-auth/:did`
- POST `/auth`
- POST `/refresh-token`
- POST `/logout`

Signup endpoints can also be added seamlessly, just need to add the following config: `{ includeSignup: true }`, by doing so, it will add the following:
- GET `/request-signup/:did`
- POST `/signup`

```typescript
import express from 'express'
import setupApp from '@rsksmart/express-did-auth'

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

## Test

From base repo directory run `npm test` or any of the described [test script variants](../../README#test).

## References

- [Decentralized Identifiers (DIDs) v1.0](https://w3c.github.io/did-core/)
- [Verifiable Credentials Data Model 1.0](https://www.w3.org/TR/vc-data-model/)
- [RFC-1994 - PPP Challenge Handshake Authentication Protocol (CHAP)](https://tools.ietf.org/html/rfc1994)
- [Verifiable Credentials JSON Schema Specification](https://w3c-ccg.github.io/vc-json-schemas/)
- [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [uPort selective disclosure implementation](https://developer.uport.me/flows/selectivedisclosure)
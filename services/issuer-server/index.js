var express = require('express')
var bodyParser = require('body-parser')
const EthrDID = require('ethr-did')
const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const { randomBytes } = require('crypto')
const {
  REQUEST_POST_PATH,
  RESPONSE_GET_PATH,
  hashCredentialRequest,
  requestParser,
  responseQueryParser } = require('../../packages/rif-id-comms/lib/requestCredential')

var app = express()
const port = process.argv.length > 2 ? process.argv[2] : 3000

var jsonParser = bodyParser.json()

const issuer = new EthrDID({
  address: '0xf1232f840f3ad7d23fcdaa84d6c66dac24efb198',
  privateKey: 'd8b595680851765f38ea5405129244ba3cbad84467d190859f4c8b20c1ff6c75'
})

const issuing = {}
const issued = {}

app.post(REQUEST_POST_PATH, jsonParser, function (req, res) {
  const payload = requestParser(req.body)
  const { did, metadata } = payload

  if(!did) {
    return res.status(500).send('Invalid credential request')
  }

  const token = randomBytes(32).toString('hex')
  const hash = hashCredentialRequest(payload, token)

  issuing[hash] = true

  createVerifiableCredentialJwt({
    sub: did,
    nbf: 1562950282,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: {
        ...metadata
      }
    }
  }, issuer).then(jwt => {
    issuing[hash] = false
    issued[hash] = jwt
  })

  res.send({ token })
})

app.get(RESPONSE_GET_PATH, jsonParser, function (req, res) {
  const hash = responseQueryParser(req.query)

  if (issuing[hash]) res.send({})
  else if (issued[hash]) res.send(issued[hash])
  else res.status(500).send('Credential not requested')
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

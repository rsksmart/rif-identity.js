var express = require('express')
var bodyParser = require('body-parser')
const EthrDID = require('ethr-did')
const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const { randomBytes } = require('crypto')
const keccak256 = require('keccak256')
require('dotenv').config()

const PORT = process.env.PORT || 3000

var app = express()
// const port = process.argv.length > 2 ? process.argv[2] : 3000

var jsonParser = bodyParser.json()
const publicKey = process.env.PUBLIC_KEY
const issuer = new EthrDID({
  address: process.env.ADDRESS,
  privateKey: process.env.PRIVATE_KEY
})

const logger = (type, data) => {
  const date = new Date()
  const dateString = `${date.getHours()}:${(date.getMinutes() < 10 ? '0' : '') + date.getMinutes()}`
  console.log(`[${dateString}] ${type.toUpperCase()} ${data}`)
}

const issuing = {}
const issued = {}
const challenge = {}

app.post('/request', jsonParser, function (req, res) {
  const { did, ...payload } = req.body

  if (!did) {
    return res.status(500).send('Invalid credential request')
  }

  const token = randomBytes(32).toString('hex')
  const hash = keccak256(did + token).toString('hex')

  issuing[hash] = true

  createVerifiableCredentialJwt({
    sub: did,
    nbf: 1562950282,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      exp: +new Date() + 31536000,
      credentialSubject: {
        ...payload,
        'Issuance Office': 'North Office',
        'License Number': 1234567890,
        'License Type': 'A2',
        'Vehicle Type': ['Car', 'Semi-truck'],
        international: false
      }
    }
  }, issuer).then(jwt => {
    issuing[hash] = false
    issued[hash] = jwt
  })

  logger('token issued:', token)
  res.send({ token })
})

app.get('/', jsonParser, function (req, res) {
  const { hash } = req.query

  logger('requesting', hash)

  if (issuing[hash]) res.send({})
  else if (issued[hash]) res.send(issued[hash])
  else res.status(500).send('Credential not requested')
})

app.get('/info', jsonParser, function (req, res) {
  res.send({ name: 'Government of Fun', public_key: publicKey })
})

app.listen(PORT, () => logger('start', `Issuer Server listening at http://localhost:${PORT}`))

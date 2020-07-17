var express = require('express')
var bodyParser = require('body-parser')
const EthrDID = require('ethr-did')
const { createVerifiableCredentialJwt } = require('did-jwt-vc')
const { randomBytes } = require('crypto')

var app = express()
const port = process.argv.length > 2 ? process.argv[2] : 3000

var jsonParser = bodyParser.json()

const issuer = new EthrDID({
  address: '0xf1232f840f3ad7d23fcdaa84d6c66dac24efb198',
  privateKey: 'd8b595680851765f38ea5405129244ba3cbad84467d190859f4c8b20c1ff6c75'
})

const issuing = {}
const issued = {}
const challenge = {}

app.post('/request', jsonParser, function (req, res) {
  const { did, ...payload } = req.body

  if(!did) {
    return res.status(500).send('Invalid credential request')
  }

  const token = randomBytes(32).toString('hex')

  issuing[did] = true
  challenge[did] = token

  createVerifiableCredentialJwt({
    sub: did,
    nbf: 1562950282,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: {
        ...payload
      }
    }
  }, issuer).then(jwt => {
    issuing[did] = false
    issued[did] = jwt
  })

  res.send({ did, token })
})

app.get('/', jsonParser, function (req, res) {
  const { did, token } = req.body

  if(challenge[did] !== token) res.status(500).send('Invalid request')
  else if (issuing[did]) res.send({})
  else if (issued[did]) res.send(issued[did])
  else res.status(500).send('Credential not requested')
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

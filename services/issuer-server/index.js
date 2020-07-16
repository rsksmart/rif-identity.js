var express = require('express')
var bodyParser = require('body-parser')
const EthrDID = require('ethr-did')
const { createVerifiableCredentialJwt } = require('did-jwt-vc')

var app = express()
const port = process.argv.length > 2 ? process.argv[2] : 3000

var jsonParser = bodyParser.json()

const issuer = new EthrDID({
  address: '0xf1232f840f3ad7d23fcdaa84d6c66dac24efb198',
  privateKey: 'd8b595680851765f38ea5405129244ba3cbad84467d190859f4c8b20c1ff6c75'
})

const issuing = {}
const issued = {}

app.post('/request', jsonParser, function (req, res) {
  const { did } = req.body

  if(!did) {
    return res.status(500).send('Invalid credential request')
  }

  issuing[did] = true

  createVerifiableCredentialJwt({
    sub: did,
    nbf: 1562950282,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential'],
      credentialSubject: {
        degree: {
          type: 'BachelorDegree',
          name: 'Baccalauréat en musiques numériques'
        }
      }
    }
  }, issuer).then(jwt => {
    issuing[did] = false
    issued[did] = jwt
  })

  res.send('Issuing')
})

app.get('/', jsonParser, function (req, res) {
  const { did } = req.body

  if (issuing[did]) res.send({})
  else if (issued[did]) res.send(issued[did])
  else res.status(500).send('Credential not requested')
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))

# Issuer server

## Features

- Request credential, receive a challenge, and query credential using challenge

## Setup

Install dependencies:

```
npm i
```

## Run

Run server with:

```
node index.js PORT
```

- `PORT` optional server port

## Develop

Run for development:

```
npx nodemon index.js PORT
```

- `PORT` optional server port

## Usage

To request a credential:

```
POST to /request:

{
  "did": "did:ethr:rsk:0x1234567801010101010101001", # any did you want
  "age": 20, # metadata to be added to the credential
  "github": "ilanolkies"
}

Response: a token to use to receive the credential
{
  "token": "65019bafbac343b58f44fdd75be1da191fe2afe34f76fc8f9453404333409827"
}
```

To receive a credential:

```
GET to /:
{
  "hash": "3e01e76f5684738d5c8ce5fd75995ebe94dfa9e5cc7f82961657418880b412e9"
}

Response: a JWT
eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7ImFnZSI6MjAsIm90aGVyVGhpbmdJV2FudCI6Imkgc2V0IGl0IGhlcmUifX0sInN1YiI6ImRpZDpldGhyOnJzazoweDEyMzQ1Njc4MDEwMTAxMDEwMTAxMDEwMDEiLCJuYmYiOjE1NjI5NTAyODIsImlzcyI6ImRpZDpldGhyOjB4ZjEyMzJmODQwZjNhZDdkMjNmY2RhYTg0ZDZjNjZkYWMyNGVmYjE5OCJ9.gAQ6WTu7Dcm1f4s4UO-3K4VQDRzeeAx3hjBzHGMVs7uJExbwfWz7l1CsD3pRZWbsxDdgdshQmqVJ_I-TkeVevg
```

Where `hash` is `keccak256(did + token)`

import { requestCredential } from '../src/requestCredential'

// TODO: this is not a good test...
test('request credential', async () => {
  const request = { did: 'did:ethr:rsk:0x22271517343929682c72F7F3e081E25577364687', metadata: { meta: 'meta' } }
  const tryReceive = await requestCredential('http://localhost:3000', request)

  const data = await tryReceive()

  expect(data).not.toEqual({})
})

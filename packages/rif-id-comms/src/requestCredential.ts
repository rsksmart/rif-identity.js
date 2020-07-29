import axios from 'axios'
import keccak256 from 'keccak256'

export const hashCredentialRequest = (request: any, token: string) => keccak256(JSON.stringify(request) + token).toString('hex')

export const requestCredential = (url: string, request: any) =>
  axios.post(`${url}/requestCredential`, { payload: request })
    .then(({ data: { token } }) => () => axios.get(`${url}/?request=${hashCredentialRequest(request, token)}`))

import keccak256 from 'keccak256'

export const hashCredentialRequest = (request: Object, token: string) => keccak256(JSON.stringify(request) + token).toString('hex')

export const REQUEST_POST_PATH = '/requestCredential'
export const RESPONSE_GET_PATH = '/response'
export const RESPONSE_GET_QUERY = '?request='

interface HttpsRequestCredential<T, U> {
  post: (url: string, data: any) => Promise<T>
  tokenFromResponse: (response: T) => string
  get: (url: string) => Promise<U>
}

const responseUrl = (url: string, request: Object, token: string) => url + RESPONSE_GET_PATH + RESPONSE_GET_QUERY + hashCredentialRequest(request, token)

export function requestCredential<T, U>(httpsInterface: HttpsRequestCredential<T, U>) {
  const p = (url: string) => (request: Object) =>
    httpsInterface.post(url + REQUEST_POST_PATH, { payload: request })
      .then(httpsInterface.tokenFromResponse)
      .then(token => () => httpsInterface.get(responseUrl(url, request, token)))

  return p
}

export const requestParser = (body: any) => body.payload
export const responseQueryParser = (query: any)  => query.request

export type Callback<T> = (err?: Error, res?: T) => void

export const callbackify = (promise, cb) => cb ? promise().then(res => cb(undefined, res)).catch(err => cb(err, undefined)) : promise()

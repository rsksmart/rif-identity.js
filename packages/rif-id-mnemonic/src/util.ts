export const validate = <T>(f: (x: T) => boolean) => (e: string) => (x: T) => {
  if (f(x)) throw e
  return x
}

import { createJWT } from 'did-jwt'
import { ChallengeVerifier, SignupConfig, SelectiveDisclosureRequest } from '../types'

export default function requestSignupFactory (challengeVerifier: ChallengeVerifier, signupConfig: SignupConfig) {
  return async function (req, res) {
    const { did } = req.params

    const challenge = challengeVerifier.get(did)

    const { requiredClaims, requiredCredentials, serviceDid, signer } = signupConfig
  
    if (requiredClaims || requiredCredentials) {
      const sdrData: SelectiveDisclosureRequest = {
        subject: did,
        issuer: serviceDid, 
        claims: requiredClaims,
        credentials: requiredCredentials,
      }

      const sdr = await createJWT(
        { type: 'sdr', ...sdrData },
        { signer, issuer: serviceDid },
        { typ: 'JWT', alg: 'ES256K' }
      )

      return res.status(200).send({ challenge, sdr })
    }

    return res.status(200).send({ challenge })
  }
}
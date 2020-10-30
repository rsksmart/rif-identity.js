import { createJWT } from 'did-jwt'
import { ChallengeVerifier } from '../classes/challenge-verifier'
import { INVALID_DID } from '../errors'
import { SignupConfig } from '../types'
import { SelectiveDisclosureRequest } from 'daf-selective-disclosure'

export function requestSignupFactory (challengeVerifier: ChallengeVerifier, signupConfig: SignupConfig) {
  return async function (req, res) {
    const { did } = req.params

    if (!did) return res.status(401).send(INVALID_DID)

    const challenge = challengeVerifier.get(did)

    const { requiredClaims, requiredCredentials, serviceDid, serviceSigner: signer } = signupConfig

    if (!requiredClaims && !requiredCredentials) return res.status(200).send({ challenge })

    const sdrData: SelectiveDisclosureRequest = {
      subject: did,
      issuer: serviceDid,
      credentials: requiredCredentials,
      claims: requiredClaims
    }

    const sdr = await createJWT(
      { type: 'sdr', ...sdrData },
      { signer, issuer: serviceDid },
      { typ: 'JWT', alg: 'ES256K' }
    )

    return res.status(200).send({ challenge, sdr })
  }
}

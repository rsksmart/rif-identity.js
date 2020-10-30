import { ChallengeVerifier } from '../classes/challenge-verifier'
import { INVALID_DID } from '../errors'

export function requestAuthFactory (challengeVerifier: ChallengeVerifier) {
  return function (req, res) {
    const { did } = req.params

    if (!did) return res.status(401).send(INVALID_DID)

    const challenge = challengeVerifier.get(did)

    return res.status(200).send({ challenge })
  }
}

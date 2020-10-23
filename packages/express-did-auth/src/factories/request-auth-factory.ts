import { ChallengeVerifier } from '../classes/challenge-verifier'
import { ErrorCodes } from '../errors'

export default function requestAuthFactory (challengeVerifier: ChallengeVerifier) {
  return function (req, res) {
    const { did } = req.params

    if (!did) return res.status(401).send(ErrorCodes.INVALID_DID)

    const challenge = challengeVerifier.get(did)

    res.status(200).send({ challenge })
  }
}

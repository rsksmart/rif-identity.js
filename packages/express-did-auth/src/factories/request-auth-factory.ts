import { ChallengeVerifier } from '../types'

export default function requestAuthFactory (challengeVerifier: ChallengeVerifier) {
  return function (req, res) {
    const { did } = req.params

    const challenge = challengeVerifier.get(did)

    res.status(200).send({ challenge })
  }
}
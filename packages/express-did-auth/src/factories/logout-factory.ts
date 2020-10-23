import { SessionManager } from '../classes/session-manager'

export default function logoutFactory (sessionManager: SessionManager) {
  // this function assumes it is invoked after a middleware that injects the user did in the request object
  return function (req, res) {
    sessionManager.delete(req.user.did)

    res.status(200).send()
  }
}

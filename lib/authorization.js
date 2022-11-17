const jwt = require('jsonwebtoken')

// Return an Error with an attribute `status` attached to it.
// TODO: move to common module
const createError = (status, msg) => {
  const err = new Error(msg)

  err.status = status

  return err
}

// If a bearer token has been sent in the authorization header, use that,
// otherwise, check if a token was sent in the request body, as a parameter, or
// part of the query string, or in the 'x-access-token' header.
// The authorization header is two string separated by a space, the first chunk
// being "Bearer" the second being the token, like `Authorization: Bearer <token>`.
const getToken = req => {
  const authHeaderParts = req?.headers?.authorization?.split(' ') || []

  if (authHeaderParts[0] === 'Bearer') {
    return authHeaderParts[1]
  }

  return req.headers['x-access-token']
    || req.body.token
    || req.query.token // WARNING: should we support token in query params?
}

// Convenience function to return the current value of the cred(entials) to help
// encapsulate the implementation details (in case we need to change them in the future).
const getCred = key => req => {
  return req[key]
}

// Return a middleware that verifies a valid token and attaches its payload to
// the request on `key` for use in other functions down the middleware chain.
// TODO: This is pertty convoluted. Refactor to use authentication.verify()
// instead of redefining it here (can't pass in through argument)
const requireValidToken = (key, secret, issuer, algorithm, verify) => async (req, res, next) => {
  const token = getToken(req)
  const options = {
    issuer,
    algorithms: [algorithm]
  }

  if (!token) {
    return next(createError(401, 'No token provided'))
  }

  // WARNING: Mutates the express request object by appending cred(entials).
  const addToReq = payload => {
    req[key] = {
      payload,
      token
    }
  }

  // If verify is not defined, verify the token directly.
  // NOTE: This will not verify if the token is in the whitelist cache as this
  // method is not connected to the cred instance. To do that, pass in a verify
  // function that is aware of the cred instance (and its cache).
  if (!verify) {
    return jwt.verify(token, secret, options, (error, payload) => {
      if (error || !payload || !payload.jti) return next(error)

      addToReq(payload)

      return next()
    })
  }

  try {
    const payload = await verify(token, secret, options)

    addToReq(payload)

    return next()
  } catch (error) {
    next(createError(401, `Authentication failed: ${error}`))
  }
}

// If at least one of the permittedActions exists in requiredActions, then consider
// the minimum requirements for authorization satisfied, and thus has permission.
// @requiredActions - Array|String - The necessary actions required to have permission.
// @permittedActions - Array - The actions that have actually been permitted.
const hasPermission = (requiredActions, permittedActions) => {
  if (!permittedActions) return false

  // If requiredActions is an Array, loop through each element. If any of the
  // requiredActions exist in permittedActions, permission is given.
  if (Array.isArray(requiredActions)) {
    return requiredActions.reduce((hasRequiredAction, action) => {
      return permittedActions.indexOf(action) >= 0
        ? true
        : hasRequiredAction
    }, false)
  }

  // If requiredActions is not an Array, treat it as a String.
  return permittedActions.includes(requiredActions)
}

// For the given app_name (from params), check if the current user has any of
// the requiredActions in his/her permissions (as given by the requested token
// payload).
//
// For reference, an example token payload looks like this:
// {
//   "jti": "2WEKaVNO",
//   "userId": "5658ac26bd4b2b5fde60bf53",
//   "username": "rob",
//   "email": "rob@email.com",
//   "isActive": true,
//   "isAdmin": true,
//   "permissions": ["action1", "action2"]
//   "iat": 1448652011,
//   "exp": 1448652911,
//   "iss": "cred-issuer"
// }
const requirePermission = key => requiredActions => (req, res, next) => {
  // Expect `req[key]` to exist with a payload attribute (would have been
  // created by requireValidToken()).
  if (!req[key]) {
    return next(createError(400, `Cred auth attribute '${key}' missing in request`))
  }

  if (!req[key].payload) {
    return next(createError(400, 'Cred auth attribute has no payload'))
  }

  if (!req[key].payload.permissions) {
    return next(createError(401, 'Payload has no permissions'))
  }

  // NOTE: This requires the existence of req[key] with a property called
  // "payload" that has "permissions". This should exist if the middleware
  // requireValidToken was used before calling this function.
  const { permissions } = req[key].payload

  // If the token payload has a set of actions for this app's name and those
  // actions include at least one of the requiredActions, proceed to next().
  if (!hasPermission(requiredActions, permissions)) {
    return next(createError(401, 'Insufficient permissions'))
  }

  next()
}

const requireProp = key => (name, value) => (req, res, next) => {
  // Expect `req[key]` to exist with a payload attribute (would have been
  // created by requireValidToken()).
  if (!req[key]) {
    return next(createError(400, `Cred auth attribute "${key}" missing in request`))
  }

  if (!req[key].payload) {
    return next(createError(400, 'Cred auth attribute has no payload'))
  }

  if (!req[key].payload[name] || req[key].payload[name] !== value) {
    return next(createError(401, 'Insufficient priviledges'))
  }

  next()
}

module.exports = {
  getCred,
  getToken,
  createError,
  requireValidToken,
  requirePermission,
  requireProp
}

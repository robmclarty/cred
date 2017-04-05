'use strict';

const jwt = require('jsonwebtoken');

// Return an Error with an attribute `status` attached to it.
const createError = (status, msg) => {
  const err = new Error(msg);

  err.status = status;

  return err;
};

// If a bearer token has been sent in the authorization header, use that,
// otherwise, check if a token was sent in the request body, as a parameter, or
// part of the query string, or in the 'x-access-token' header.
// The authorization header is two string separated by a space, the first chunk
// being "Bearer" the second being the token, like `Authorization: Bearer <token>`.
const tokenFromReq = req => {
  if (req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }

  return req.headers['x-access-token'] ||
    req.body.token ||
    req.query.token;
};

// Return a middleware that verifies a valid token and attaches its payload to
// the request on `key` for use in other functions down the middleware chain.
const requireValidToken = (key, secret, issuer, algorithm, verify) => (req, res, next) => {
  const token = tokenFromReq(req)
  const options = { issuer, algorithms: [algorithm] }
  const assignPayloadToReq = payload => {
    req[key] = { payload, token }
  }

  if (!token) return next(createError(401, 'No token provided.'))

  // If verify is not defined, verify the token directly.
  // NOTE: This will not verify if the token is in the whitelist cache as this
  // method is not connected to the cred instance. To do that, pass in a verify
  // function that is aware of the cred instance (and its cache).
  if (!verify) return jwt.verify(token, secret, options, (err, payload) => {
    if (err || !payload || !payload.jti) return next(err)

    assignPayloadToReq(payload)

    return next()
  })

  verify(token, secret, options)
    .then(assignPayloadToReq)
    .then(next)
    .catch(err => next(createError(401, `Authentication failed: ${ err }`)))
}

// If at least one of the permittedActions exists in requiredActions, then consider
// the minimum requirements for authorization satisfied, and thus has permission.
// @requiredActions - Array|String - The necessary actions required to have permission.
// @permittedActions - Array - The actions that have actually been permitted.
const hasPermission = (requiredActions, permittedActions) => {
  if (!permittedActions) return false;

  // If requiredActions is an Array, loop through each element. If any of the
  // requiredActions exist in permittedActions, permission is given.
  if (Array.isArray(requiredActions)) {
    return requiredActions.reduce((hasRequiredAction, action) => {
      return permittedActions.indexOf(action) >= 0 ?
        true :
        hasRequiredAction;
    }, false);
  }

  // If requiredActions is not an Array, treat it as a String.
  if (permittedActions.indexOf(requiredActions) >= 0) return true;

  return false;
}

// For the given app_name (from params), check if the current user has any of
// the requiredActions in his/her permissions (as given by the requested token
// payload).
//
// A token's `permissions` object has a set of attributes which are themselves
// appName strings, thus allowing us to retrieve a particular app's set of
// permissible actions by referencing it through `permissions[name]`.
//
// For reference, an example token payload looks like this:
// {
//   "jti": "2WEKaVNO",
//   "userId": "5658ac26bd4b2b5fde60bf53",
//   "username": "rob",
//   "email": "rob@email.com",
//   "isActive": true,
//   "isAdmin": true,
//   "permissions": {
//     "resource-name": {
//       "actions": ["action1", "action2"]
//     },
//     "another-resource-name": {
//       "actions": ["action3"]
//     }
//   },
//   "iat": 1448652011,
//   "exp": 1448652911,
//   "iss": "cred-issuer"
// }
const requireResourcePermission = (key, resourceName) => requiredActions => (req, res, next) => {
  // Expect `req[key]` to exist with a payload attribute (would have been
  // created by requireValidToken()).
  if (!req[key])
    return next(createError(400, `Cred auth attribute "${ key }" missing in request`))
  if (!req[key].payload)
    return next(createError(400, 'Cred auth attribute has no payload'))
  if (!req[key].payload.permissions)
    return next(createError(401, 'Payload has no permissions'))
  if (!req[key].payload.permissions[resourceName])
    return next(createError(401, `No permissions for resource "${ resourceName }"`))

  // NOTE: This requires the existence of req[key] with a property called
  // "payload" that has "permissions". This should exist if the middleware
  // requireValidToken was used before calling this function.
  const permission = req[key].payload.permissions[resourceName]

  // If the token payload has a set of actions for this app's name and those
  // actions include at least one of the requiredActions, proceed to next().
  if (!permission || !hasPermission(requiredActions, permission.actions))
    return next(createError(401, 'Insufficient permissions'))

  next()
}

const requirePropIn = key => (name, value) => (req, res, next) => {
  // Expect `req[key]` to exist with a payload attribute (would have been
  // created by requireValidToken()).
  if (!req[key])
    return next(createError(400, `Cred auth attribute "${ key }" missing in request`))
  if (!req[key].payload)
    return next(createError(400, 'Cred auth attribute has no payload'))
  if (!req[key].payload[name] || req[key].payload[name] !== value)
    return next(createError(401, `Insufficient priviledges`))

  next()
}

module.exports = {
  tokenFromReq,
  createError,
  requireValidToken,
  requireResourcePermission,
  requirePropIn
}

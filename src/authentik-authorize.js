'use strict';

const jwt = require('jsonwebtoken');

const authentikAuthorize = ({
  name = 'resource',
  issuer = 'authentik',
  secret = 'access-secret',
  alg = 'HS256'
}) => {
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

  const verify = token => new Promise((resolve, reject) => {
    const options = {
      issuer,
      algorithms: [alg]
    };

    jwt.verify(token, secret, options, (err, payload) => {
      if (err || !payload || !payload.jti)
        reject(`Failed to authenticate token: ${ err }`);

      resolve(payload);
    });
  });

  // If at least one of the permittedActions exists in requiredActions, then consider
  // the minimum requirements for authorization satisfied, and thus has permission.
  // @requiredActions - Array|String - The necessary actions required to have permission.
  // @permittedActions - Array - The actions that have actually been permitted.
  const hasPermission = (requiredActions, permittedActions) => {
    if (!permittedActions) return false;

    // If requiredActions is an Array, loop through each element. If any of
    // the requiredActions exist in permittedActions, permission is given.
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
  //   "email": "r@robmclarty.com",
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
  //   "iss": "authentik"
  // }
  const requirePermission = requiredActions => (req, res, next) => {
    const permission = req.auth.permissions[name];

    // If the token payload has a set of actions for this app's name and those
    // actions include at least one of the requiredActions, proceed to next().
    if (!resourceName ||
        !permission ||
        !hasPermission(requiredActions, permission.actions))
      next(createError(401, 'Insufficient permissions.'));

    next();
  }

  return {
    tokenFromReq,
    verify,
    requirePermission
  };
};

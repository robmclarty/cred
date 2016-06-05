'use strict';

const jwt = require('jsonwebtoken');
const {
  createError,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  PAGE_NOT_FOUND,
  UNPROCESSABLE,
  GENERIC_ERROR
} = require('../helpers/error_helper');

// Look up req.auth associated with JWT and verify that it has admin priviledges.
// req.auth is created in the token_middleware which parses a JWT sent with
// the current request.
const requireAdmin = (req, res, next) => {
  if (!req.auth) {
    next(createError({
      status: FORBIDDEN,
      message: 'No authentication token provided.'
    }));
  }

  // Check if req.auth is for an admin; if not, they're unauthorized.
  if (!req.auth.isAdmin || !req.auth.isActive) {
    next(createError({
      status: UNAUTHORIZED,
      message: 'You are not authorized to access this resource.'
    }));
  }

  // If we made it this far, the user's token must be valid and is an admin.
  next();
}

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
// permissible actions by referencing it through `permissions[appName]`.
//
// NOTE: The requiredPermissions are calculated based on a URL parameter :app_name.
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
  // If this is an admin, immediately proceed.
  if (req.auth.isAdmin) next();

  const resourceName = req.params.resource_name;
  const permission = req.auth.permissions[resourceName];

  // If the token payload has a set of actions for this app's name and those
  // actions include at least one of the requiredActions, proceed to next().
  if (resourceName &&
      permission &&
      hasPermission(requiredActions, permission.actions)) next();

  next(createError({
    status: UNAUTHORIZED,
    message: 'Insufficient permissions.'
  }));
}

// Either req.auth matches the parameter id, or req.auth is a super-admin.
const requireOwner = (req, res, next) => {
  if (!req.auth) {
    next(createError({
      status: FORBIDDEN,
      message: 'No authentication token provided.'
    }));
  }

  if (!req.params.id) {
    next(createError({
      status: BAD_REQUEST,
      message: 'Requires a user id.'
    }));
  }

  if (req.auth.userId !== req.params.id && !req.auth.isAdmin) {
    next(createError({
      status: UNAUTHORIZED,
      message: 'You are not authorized to modify this resource.'
    }));
  }

  next();
}

// Revoke a refreshToken to prevent further accessTokens from being generated
// with it. This can be done in one of two ways: 1) revoke the currently used
// refresh token provided in the authorization header (facilitates "logout"),
// 2) revoke another user's token by providing an optional attribute in the
// request body called 'token' (also a refresh token). If the requesting user
// is authorized to delete the other user's token, that token will be invalidated.
const requireTokenOwner = (req, res, next) => {
  if (!req.refreshAuth) {
    next(createError({
      status: FORBIDDEN,
      message: 'No authentication token provided.'
    }));
  }

  // If a token was provided in the body, ensure that the user of the
  // token in the authorization header has permission to delete it.
  if (req.body.token) {
    const token = jwt.decode(req.body.token);

    if (req.refreshAuth.userId !== token.userId && !req.refreshAuth.isAdmin) {
      next(createError({
        status: UNAUTHORIZED,
        message: 'You are not authorized to modify this token.'
      }));
    }
  }

  next();
}

Object.assign(exports, {
  requireAdmin,
  requirePermission,
  requireOwner,
  requireTokenOwner
});

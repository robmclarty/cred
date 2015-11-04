'use strict';

let { validateToken, getTokenFromRequest } = require('../helpers/token_helper');
let { createError, errorCodes } = require('../helpers/error_helper');

// Check for the presence of a JSON Web Token called 'token' and verify that it
// is valid by comparing it against a secret key.
exports.requireValidToken = function (req, res, next) {
  let token = getTokenFromRequest(req);

  // Token does not exist.
  if (!token) {
    return next(createError({
      status: errorCodes.badRequest,
      message: 'No token provided.'
    }));
  }

  // TODO: Maybe change this to be a promise instead of using a callback.
  validateToken({
    secret: req.app.get('token-secret'),
    issuer: req.app.get('token-issuer'),
    token: token
  }, function done(err, payload) {
    if (err || !payload) {
      return next(createError({
        status: errorCodes.unauthorized,
        message: 'Failed to authenticate token.'
      }));
    }

    req.auth = payload;

    return next();
  });
};

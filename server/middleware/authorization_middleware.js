'use strict';

let { createError, errorCodes } = require('../helpers/error_helper');

// Look up req.auth associated with JWT and verify that it has admin priviledges.
// req.auth is created in the token_middleware which parses a JWT sent with
// the current request.
exports.requireAdmin = function (req, res, next) {
  if (!req.auth) {
    return next(createError({
      status: errorCodes.forbidden,
      message: 'No token payload.'
    }));
  }

  // Check if req.auth is for an admin; if not, they're unauthorized.
  // TODO: This could be extended to create other middlewares that check on a possible
  // "roles" property to see if a particular role (in this case "admin") exists.
  if (!req.auth.isAdmin) {
    return next(createError({
      status: errorCodes.unauthorized,
      message: 'You are not authorized to access this resource.'
    }));
  }

  // If we made it this far, the user's token must be valid and is an admin.
  next();
};

// TODO: implement a method of checking that the currentUser can access resources.
exports.requireOwn = function (req, res, next) {
  next();
};

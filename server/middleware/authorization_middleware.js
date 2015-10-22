'use strict';

let errorHandler = require('../middleware/error_middleware');

// Look up session associated with JWT and verify that it has admin priviledges.
// req.session is created in the token_middleware which parses a JWT sent with
// the current request.
exports.requireAdmin = function (req, res, next) {
  // Verify that a "session" exists on the request.
  if (!req.session) {
    return next(createError({
      status: errorHandler.codes.forbidden,
      message: 'No session exists.'
    }));
  }

  // Check if the session is for an admin; if not, they're unauthorized.
  // TODO: This could be extended to create other middlewares that check on a possible
  // "roles" property to see if a particulr role (in this case "admin") exists.
  if (!req.session.isAdmin) {
    return next(createError({
      status: errorHandler.codes.unauthorized,
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

'use strict';

// Look up session associated with JWT and verify that it has admin priviledges.
// req.session is created in the token_middleware which parses a JWT sent with
// the current request.
module.exports = function requireAdmin(req, res, next) {
  // Verify that a "session" exists on the request.
  if (!req.session) {
    let noSessionError = new Error('No session exists.');
    noSessionError.status = 403;

    return next(noSessionError);
  }

  // Check if the session is for an admin; if not, they're unauthorized.
  // TODO: This could be extended to create other middlewares that check on a possible
  // "roles" property to see if a particulr role (in this case "admin") exists.
  if (!req.session.isAdmin) {
    let notAdminError = new Error('You are not authorized to access this resource.');
    notAdminError.status = 403;

    return next(notAdminError);
  }

  // If we made it this far, the user's token must be valid and is an admin.
  next();
};

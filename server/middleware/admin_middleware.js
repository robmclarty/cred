'use strict';

// Look up session associated with JWT and verify that it has admin priviledges.
// req.session is created in the token_middleware which parses a JWT sent with
// the current request.
exports.requireAdmin = function (req, res, next) {
  if (!req.session) {
    return res.status(403).send({
      success: false,
      message: 'No session exists.'
    });
  }

  // Check if the session is for an admin; if not, they're unauthorized.
  // TODO: This could be extended to create other middlewares that check on a possible
  // "roles" property to see if a particulr role (in this case "admin") exists.
  if (!req.session.isAdmin) {
    return res.status(403).send({
      success: false,
      message: 'You are not authorized to access this resource.'
    });
  }

  next();
};

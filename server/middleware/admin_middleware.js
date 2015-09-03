// Look up user associated with token and verify that they have admin priviledges.
exports.requireAdmin = function (req, res, callback) {
  var decoded = req.decoded;

  // Assumes that requireValidToken has already run on the request.
  if (!decoded) {
    return res.status(403).send({
      success: false,
      message: 'No valid token.'
    });
  }

  // Check if the user associated with the token is an admin; if not, they're unauthorized.
  if (!decoded.user.isAdmin) {
    return res.status(403).send({
      success: false,
      message: 'You are not authorized to access this resource.'
    });
  }

  return callback();
};

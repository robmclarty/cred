var jwt = require('jsonwebtoken');

// If a bearer token has been sent in the authorization header, use that,
// otherwise, check if a token was sent in the request body, as a parameter, or
// part of the query string, or in the 'x-access-token' header.
// The authorization header is two string separated by a space, the first chunk
// being "Bearer" the second being the token, like `Authorization: Bearer <token>`.
function getTokenFromRequest(req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  } else {
    return req.headers['x-access-token'] || req.body.token || req.query.token;
  }
}

// Checks for the presence of a JWT token called 'token' and verifies that it
// is valid by comparing it against the secret.
module.exports = function (req, res, next) {
  var apiSecret = req.app.get('api-secret');
  var token = getTokenFromRequest(req);

  if (!token) {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  } else {
    jwt.verify(token, apiSecret, function (err, decodedPayload) {
      if (err) {
        return res.json({
          success: false,
          message: 'Failed to authenticate token.'
        });
      } else {
        req.session = decodedPayload;

        next();
      }
    });
  }
};

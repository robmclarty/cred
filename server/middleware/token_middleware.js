'use strict';

const { verifyToken, getTokenFromRequest } = require('../helpers/token_helper');
const {
  createError,
  BAD_REQUEST,
  UNAUTHORIZED
} = require('../helpers/error_helper');

const ACCESS = 'access';
const REFRESH = 'refresh';

// Check for the presence of a JSON Web Token called 'token' and verify that it
// is valid by comparing it against a secret key.
const requireValidToken = type => (req, res, next) => {
  const token = getTokenFromRequest(req);
  const options = {
    token,
    issuer: req.app.get('token-issuer'),
    secret: '',
    algorithm: 'HS256'
  };

  // Token does not exist.
  if (!token) {
    next(createError({
      status: BAD_REQUEST,
      message: 'No token provided.'
    }));
  }

  switch(type) {
  case ACCESS:
    Object.assign(options, {
      secret: req.app.get('token-access-public-key'),
      algorithm: req.app.get('token-access-alg')
    });
    break;
  case REFRESH:
    Object.assign(options, {
      secret: req.app.get('token-refresh-secret'),
      algorithm: req.app.get('token-refresh-alg')
    });
    break;
  default:
    // do nothing
  }

  // ***** This is where the req.auth magic happens. *****
  //
  // If valid token, create a new attribute `auth` on the request object where
  // the token's payload will be stored and accessible by other parts of the
  // app.
  verifyToken(options)
    .then(payload => {
      req.auth = payload;
      next();
    })
    .catch(err => next(createError({
      status: UNAUTHORIZED,
      message: err
    })));
};

const requireValidAccessToken = requireValidToken(ACCESS);
const requireValidRefreshToken = requireValidToken(REFRESH);

Object.assign(exports, {
  requireValidAccessToken,
  requireValidRefreshToken
});

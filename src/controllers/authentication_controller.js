'use strict';

const User = require('../models/user');
const {
  createError,
  BAD_REQUEST,
  UNAUTHORIZED,
  UNPROCESSABLE
} = require('../helpers/error_helper');
const { createToken, revokeToken } = require('../helpers/token_helper');

const updateUserLoginAt = (user, timestamp) => {
  user.loginAt = timestamp;

  return user.save();
};

const accessTokenOptions = (app, payload) => ({
  payload,
  issuer: app.get('token-issuer'),
  secret: app.get('token-access-private-key'),
  algorithm: app.get('token-access-alg'),
  expiresIn: app.get('token-access-expires-in')
});

const refreshTokenOptions = (app, payload) => ({
  payload,
  issuer: app.get('token-issuer'),
  secret: app.get('token-refresh-secret'),
  algorithm: app.get('token-refresh-alg'),
  expiresIn: app.get('token-refresh-expires-in')
});

// Make sure the password is correct. If it isn't return unauthorized. If it
// is, update the login date for the user and return the necessary token
// settings/options needed for creating valid tokens.
const verifyUserPassword = (app, user, password) => {
  return new Promise((resolve, reject) => {
    if (!user) {
      reject(createError({
        status: BAD_REQUEST,
        message: 'Authentication failed. Username or password did not match.'
      }));
    }

    user
      .verifyPassword(password)
      .then(match => {
        if (!match) {
          throw createError({
            status: UNAUTHORIZED,
            message: 'Authentication failed. Username or password did not match.'
          });
        }
      })
      .then(() => updateUserLoginAt(user, Date.now()))
      .then(() => resolve({
        accessTokenOptions: accessTokenOptions(app, user.tokenPayload()),
        refreshTokenOptions: refreshTokenOptions(app, user.tokenPayload())
      }))
      .catch(err => reject(err));
  });
}

// These are the options returned by the userVerifyPassword fundtion. Append
// `accessToken` to the options and return them to pass on to
// createRefreshToken().
const createAccessToken = options => {
  return createToken(options.accessTokenOptions)
    .then(accessToken => Object.assign({}, options, { accessToken }));
};

// These are the same options as for createAccessToken(), only with the property
// `accessToken` appended to it.
const createRefreshToken = options => {
  return createToken(options.refreshTokenOptions)
    .then(refreshToken => ({
      accessToken: options.accessToken,
      refreshToken
    }));
};

// Create a new user that is guaranteed to not be an admin. This is to be used
// for public-facing signup/registration with the app.
const postRegistration = (req, res, next) => {
  const newUser = req.body;

  // Admin users cannot be created through this endpoint.
  newUser.isAdmin = false;

  User
    .create(newUser)
    .then(user => {
      res.json({
        success: true,
        message: 'Registration successful.',
        user
      });
    })
    .catch(err => next(err));
};

// Takes a username + password and returns a token.
const postTokens = (req, res, next) => {
  const { username, password } = req.body;

  User
    .findOne({ username })
    .then(user => verifyUserPassword(req.app, user, password))
    .then(options => createAccessToken(options))
    .then(options => createRefreshToken(options))
    .then(tokens => {
      res.json({
        success: true,
        message: 'Tokens generated successfully.',
        tokens
      });
    })
    .catch(err => next(err));
};

// Takes a refresh-token (in the request header, validated in middleware), and
// returns a fresh access-token.
const putTokens = (req, res, next) => {
  User
    .findById(req.auth.userId)
    .then(user => {
      if (!user) {
        throw createError({
          status: BAD_REQUEST,
          message: 'Authentication failed. No user found that matches this token.'
        });
      }

      return accessTokenOptions(req.app, user.tokenPayload());
    })
    .then(options => createToken(options))
    .then(accessToken => {
      res.json({
        success: true,
        message: 'Token refreshed.',
        accessToken
      });
    })
    .catch(err => next(err));
};

// Logging out is simply done by adding the current, valid, token to a blacklist
// which will invalidate the token until its expiration date has been reached.
// The token is now no longer valid. Respond that the user is now "logged out".
const deleteToken = (req, res, next) => {
  const options = {
    tokenId: req.auth.jti,
    exp: req.auth.exp,
    redis: req.redis
  };

  revokeToken(options)
    .then(() => {
      res.json({
        success: true,
        message: 'Token revoked.'
      });
    })
    .catch(err => next(err));
};

Object.assign(exports, {
  postRegistration,
  postTokens,
  putTokens,
  deleteToken
});

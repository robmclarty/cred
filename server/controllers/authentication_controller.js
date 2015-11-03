'use strict';

let { createError, errorCodes } = require('../helpers/error_helper');
let { createToken, revokeToken } = require('../helpers/token_helper');

// Create a new user that is guaranteed to not be an admin. This is to be used
// for public-facing signup/registration with the app.
exports.postRegistration = function (req, res, next) {
  let User = req.app.models.user;
  let newUser = req.body;

  // Admin users cannot be created through this endpoint.
  newUser.isAdmin = false;

  User.create(newUser, function (err, user) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'Registration successful.',
      user: user
    });
  });
};

// Takes a username + password and returns a token.
exports.postToken = function (req, res, next) {
  let User = req.app.models.user;
  let username = req.body.username || '';
  let password = req.body.password || '';

  User.findOne({ username: username }, function (findError, user) {
    if (findError) {
      return next(findError);
    }

    // No user found with that username.
    if (!user) {
      return next(createError({
        status: errorCodes.badRequest,
        message: 'Authentication failed. Username or password did not match.'
      }));
    }

    // Make sure the password is correct.
    user.verifyPassword(password, function (passwordError, isMatch) {
      if (passwordError) {
        return next(passwordError);
      }

      // Password did not match.
      if (!isMatch) {
        return next(createError({
          status: errorCodes.unauthorized,
          message: 'Authentication failed. Username or password did not match.'
        }));
      }

      // Create a new token from the user-generated payload and app settings.
      let token = createToken({
        payload: user.tokenPayload(),
        secret: req.app.get('token-secret'),
        issuer: req.app.get('token-issuer'),
        expiresInSeconds: req.app.get('token-expires-in-seconds')
      });

      res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
      });
    });
  });
};

// Logging out is simply done by adding the current, valid, token to a blacklist
// which will invalidate the token until its expiration date has been reached.
exports.deleteToken = function (req, res, next) {
  revokeToken({
    id: req.auth.jti,
    exp: req.auth.exp
  });

  // The token is now no longer valid. Respond that the user is now "logged out".
  res.json({
    success: true,
    message: 'You are now logged out.'
  });
};

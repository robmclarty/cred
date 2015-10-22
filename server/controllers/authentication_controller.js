'use strict';

const tokenExpiresInMinutes = 1440; // expires in 24 hours

let jwt = require('jsonwebtoken');
let errorHandler = require('../middleware/error_middleware');

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
  let apiSecret = req.app.get('api-secret');
  let username = req.body.username || '';
  let password = req.body.password || '';

  User.findOne({ username: username }, function (findError, user) {
    if (findError) {
      return next(findError);
    }

    // No user found with that username.
    if (!user) {
      return next(createError({
        status: errorHandler.codes.badRequest,
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
          status: errorHandler.codes.unauthorized,
          message: 'Authentication failed. Username or password did not match.'
        }));
      }

      // Make a new token and send it back.
      let token = jwt.sign(user.tokenPayload(), apiSecret, {
        expiresInMinutes: tokenExpiresInMinutes
      });

      res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
      });
    });
  });
};

// TODO: Implement a black list for tokens which have explicitly been
// deactivated through a "logout" action.
exports.deleteToken = function (req, res, next) {

};

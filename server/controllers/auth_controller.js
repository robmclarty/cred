var jwt = require('jsonwebtoken');
var User = require('../models/user');

// Takes a username + password and returns a token.
exports.postAuthenticate = function (req, res, next) {
  var apiSecret = req.app.get('api-secret');
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }, function (findError, user) {
    if (findError) {
      return next(findError);
    }

    // No user found with that username.
    if (!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    }

    // Make sure the password is correct.
    user.verifyPassword(password, function (passwordError, isMatch) {
      if (passwordError) {
        return next(passwordError);
      }

      // Password did not match.
      if (!isMatch) {
        res.json({
          success: false,
          message: 'Authentication failed. Wrong password.',
          error: passwordError
        });
      }

      // Create the payload for the token; the 'session' for this user.
      // TODO: maybe make a method on user called "sessionPayload" or something
      // generates the payload object from itself.
      var payload = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      };

      // Make a new token and send it back.
      var token = jwt.sign(payload, apiSecret, {
        expiresInMinutes: 1440 // expires in 24 hours
      });

      res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
      });
    });
  });
};

// Takes a token and returns the decoded payload session.
exports.getSession = function (req, res) {
  res.json(req.session);
};

var jwt = require('jsonwebtoken');
var User = require('../models/user');

// Takes a username + password and returns a token.
exports.postAuthenticate = function (req, res) {
  var apiSecret = req.app.get('api-secret');
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }, function (findError, user) {
    if (findError) {
      throw findError;
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
        throw passwordError;
      }

      // Password did not match.
      if (!isMatch) {
        res.json({
          success: false,
          message: 'Authentication failed. Wrong password.',
          error: passwordError
        });
      }

      // Success; make a new token and send it back.
      var token = jwt.sign(user, apiSecret, {
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

// Takes a token and returns the decoded payload.
exports.getCheck = function (req, res) {
  res.json(req.decoded);
};

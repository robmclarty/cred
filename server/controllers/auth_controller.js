'use strict';

let jwt = require('jsonwebtoken');

// Takes a username + password and returns a token.
exports.postSession = function (req, res, next) {
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
      let noUserError = new Error('Authentication failed. Username or password did not match.');
      noUserError.status = 400;

      return next(noUserError);
    }

    // Make sure the password is correct.
    user.verifyPassword(password, function (passwordError, isMatch) {
      if (passwordError) {
        return next(passwordError);
      }

      // Password did not match.
      if (!isMatch) {
        let noMatchError = new Error('Authentication failed. Username or password did not match.');
        noMatchError.status = 401;

        return next(noMatchError);
      }

      // Create the payload for the token; the 'session' for this user.
      // TODO: maybe make a method on user called "sessionPayload" or something
      // generates the payload object from itself.
      let payload = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      };

      // Make a new token and send it back.
      let token = jwt.sign(payload, apiSecret, {
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

// TODO: Implement a black list for tokens which have explicitly been
// deactivated through a "logout" action.
exports.deleteSession = function (req, res) {

};

// TODO: Implement a public facing "signup" process which creates a new user.
exports.postRegistration = function (req, res) {

};

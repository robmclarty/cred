var User = require('../models/user');

exports.postUsers = function (req, res, next) {
  var user = new User({
    username: req.body.username,
    password: req.body.password,
    isAdmin: req.body.isAdmin
  });

  user.save(function (err) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'New user added.'
    });
  });
};

exports.getUsers = function (req, res, next) {
  User.find({}, function (err, users) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      users: users
    });
  });
};

exports.getUser = function (req, res) {

};

exports.putUser = function (req, res) {

};

exports.deleteUser = function (req, res) {

};

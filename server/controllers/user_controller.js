'use strict';

exports.postUsers = function (req, res, next) {
  let User = req.app.models.user;
  let newUser = req.body;

  User.create(newUser, function (err, user) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'User created.',
      user: user
    });
  });
};

exports.getUsers = function (req, res, next) {
  let User = req.app.models.user;

  User.find({}, function (err, users) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'Users found.',
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

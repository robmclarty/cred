'use strict';

var gulp = require('gulp-param')(require('gulp'), process.argv);
var config = require('./server/config');

// List existing users in the database by username.
gulp.task('listUsers', function() {
  var Waterline = require('waterline');
  var orm = new Waterline();
  var User = require('./server/models/user');

  orm.loadCollection(User);

  orm.initialize(config.database, function (err, models) {
    if (err) {
      throw err;
    }

    models.collections.user.find({}, function (err, users) {
      users.forEach((user) => {
        console.log(user.username);
      });
      process.exit();
    });
  });
});

// Seed the database with some initial data (e.g., default admin user).
gulp.task('createUser', function (username, password, admin) {
  var Waterline = require('waterline');
  var orm = new Waterline();
  var User = require('./server/models/user');

  orm.loadCollection(User);

  orm.initialize(config.database, function (err, models) {
    if (err) {
      throw err;
    }

    var newUser = {
      username: username,
      password: password,
      isAdmin: admin || false
    };

    models.collections.user.create(newUser, function (userErr, user) {
      if (userErr) {
        throw userErr;
      }

      console.log(`User ${username} created.`);
      process.exit();
    });
  });
});

gulp.task('lint', function () {
  var eslint = require('gulp-eslint');

  return gulp
    .src(['./server/**/*'])
    .pipe(eslint())
    .pipe(eslint.format());
});

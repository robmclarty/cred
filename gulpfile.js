'use strict';

let gulp = require('gulp-param')(require('gulp'), process.argv);
let config = require('./server/config');

// List existing users in the database by username.
gulp.task('listUsers', function() {
  let Waterline = require('waterline');
  let orm = new Waterline();
  let User = require('./server/models/user');

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
  let Waterline = require('waterline');
  let orm = new Waterline();
  let User = require('./server/models/user');

  orm.loadCollection(User);

  orm.initialize(config.database, function (err, models) {
    if (err) {
      throw err;
    }

    let newUser = {
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
  let eslint = require('gulp-eslint');

  return gulp
    .src(['./server/**/*'])
    .pipe(eslint())
    .pipe(eslint.format());
});

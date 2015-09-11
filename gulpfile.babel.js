'use strict';

import gulp from 'gulp';
import mongoose from 'mongoose';
import config from './server/config';
import User from './server/models/user';

// Seed the database with some initial data (e.g., default admin user).
gulp.task('createUser', function (username, password, admin) {
  mongoose.connect(config.database);

  // Create default admin user.
  let newUser = new User({
    username: username,
    password: password,
    isAdmin: admin || false
  });

  // Save admin user to database.
  newUser.save(function (err) {
    if (err) {
      console.log(err.toString());
      process.exit(1);
    }

    console.log('User ' + username + ' created.');
    process.exit();
  });
});

gulp.task('lint', function () {
  let eslint = require('gulp-eslint');

  return gulp
    .src(['./server/**/*'])
    .pipe(eslint())
    .pipe(eslint.format());
});

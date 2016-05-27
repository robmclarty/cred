'use strict';

const gulp = require('gulp');
const argv = require('yargs').argv;
const mongoose = require('mongoose');
const User = require('../server/models/user');
const config = require('../config/server');

// List all users in database on command line.
gulp.task('list-users', function (done) {
  mongoose.connect(config.database);
  mongoose.connection.on('error', (err) => console.log('Database Error: ', err));
  mongoose.Promise = global.Promise;

  User
    .find({})
    .then(users => {
      users.forEach(user => console.log(user.username));
      done();
      process.exit();
    })
    .catch(err => {
      console.log(err.toString());
      done();
      process.exit(1);
    });
});

// Create a new user directly.
//
// WARNING: Be careful when running this task when expecting environment
// variables to be set. They may not in fact be available when gulp is run
// which could result in the default value being used.
//
// e.g., to create a new admin user:
// `gulp create-user --username admin --password my-pass --email me@blah.com --admin true`
gulp.task('create-user', function (done) {
  mongoose.connect(config.database);
  mongoose.connection.on('error', (err) => console.log('Database Error: ', err));

  const user = new User({
    username: argv.username,
    password: argv.password,
    email: argv.email,
    isAdmin: Boolean(argv.admin) || false
  });

  user
    .save()
    .then(() => {
      console.log(`User ${ user.username } created.`);
      done();
      process.exit();
    })
    .catch(err => {
      console.log('Error:', err.toString());
      done();
      process.exit(1);
    });
});

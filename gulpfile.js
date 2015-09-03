var gulp = require('gulp');

// Seed the database with some initial data (e.g., default admin user).
gulp.task('seed', function () {
  var mongoose = require('mongoose');
  var config = require('./server/config');
  var User = require('./server/models/user');

  mongoose.connect(config.database);

  // Create default admin user.
  var adminUser = new User({
    username: config.defaultUser.username,
    password: config.defaultUser.password,
    isAdmin: true
  });

  // Save admin user to database.
  adminUser.save(function (err) {
    if (err) {
      console.log(err.toString());
      process.exit(1);
    }

    console.log('admin user created');
    process.exit();
  });
});

gulp.task('lint', function () {

});

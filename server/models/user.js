var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, require: true },
  password: { type: String, require: true },
  isAdmin: { type: Boolean, default: false }
});

UserSchema.pre('save', function (callback) {
  var user = this;

  // Break out if the password hasn't changed.
  if (!user.isModified('password')) {
    return callback();
  }

  // Password changed so we need to hash it.
  bcrypt.genSalt(10, function (saltError, salt) {
    if (saltError) {
      return callback(saltError);
    }

    bcrypt.hash(user.password, salt, null, function (hashError, hash) {
      if (hashError) {
        return callback(hashError);
      }

      user.password = hash;

      callback();
    });
  });
});

UserSchema.methods.verifyPassword = function (password, callback) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) {
      return callback(err);
    }

    callback(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);

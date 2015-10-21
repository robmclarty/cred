'use strict';

let Waterline = require('waterline');
let bcrypt = require('bcrypt-nodejs');

function afterValidate(values, next) {
  bcrypt.genSalt(10, function (saltError, salt) {
    if (saltError) {
      return next(saltError);
    }

    bcrypt.hash(values.password, salt, null, function (hashError, hash) {
      if (hashError) {
        return next(hashError);
      }

      values.password = hash;
      next();
    });
  });
}

function verifyPassword(password, next) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    if (err) {
      return next(err);
    }

    next(null, isMatch);
  });
}

function toJSON() {
  return {
    username: this.username,
    isAdmin: this.isAdmin
  };
}

let User = Waterline.Collection.extend({
  identity: 'user',
  connection: 'local-mongo',
  tableName: 'users',
  migrate: 'safe',

  afterValidate: afterValidate,

  attributes: {
    username: {
      type: 'string',
      unique: true,
      required: true
    },
    password: {
      type: 'string',
      minLength: 6,
      required: true
    },
    isAdmin: {
      type: 'boolean',
      defaultsTo: false
    },

    verifyPassword: verifyPassword,
    toJSON: toJSON
  }
});

module.exports = User;

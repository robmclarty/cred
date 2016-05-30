'use strict';

const mongoose = require('mongoose');
const argon2 = require('argon2');
const URLSafe = require('urlsafe-base64');
const Permission = require('./permission');

const SALT_LENGTH = 32;
const ARGON2_OPTIONS = {
  timeCost: 3,
  memoryCost: 12, // 2^12kb
  parallelism: 1, // threads
  argon2d: false // use agron2i
};

// Simple validation regex for email addresses. It just checks for '@' and '.'.
// Anything more than this is overkill imho and fails to capture new and emerging
// address schemas (e.g., ending in '.ninja', or including tags with a '+').
//
// If it is crucial that email addresses are verified as real email addresses,
// rather than using some convoluted and impossible-to-understand regex, simply
// send the user a confirmation email to the would-be address directly. If it
// gets confirmed, it must be real ;)
const isValidEmail = () => (/.+@.+\..+/i);

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    sparse: true,
    validate: {
      validator: URLSafe.validate,
      message: 'must be URL-safe (use hyphens instead of spaces, like "my-cool-username")'
    }
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    required: true,
    validate: {
      validator: isValidEmail,
      message: '{ VALUE } is not a valid email address.'
    }
  },
  isActive: { type: Boolean, required: true, default: true },
  isAdmin: { type: Boolean, required: true, default: false },
  profile: {
    name: { type: String, required: false },
    location: { type: String, required: false },
    website: { type: String, required: false },
    company: { type: String, require: false }
  },
  permissions: [Permission.schema],
  loginAt: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});

// Keep updatedAt current on each save.
UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  next();
});

// Convert password as argon2 hash before saving it.
UserSchema.pre('save', function (next) {
  const user = this;

  // Break out if the password hasn't changed.
  if (!user.isModified('password')) return next();

  // If password has changed, hash it.
  argon2
    .generateSalt(SALT_LENGTH)
    .then(salt => argon2.hash(user.password, salt, ARGON2_OPTIONS))
    .then(hash => {
      user.password = hash;
      next();
    })
    .catch(err => next(err));
});

const verifyPassword = function (password) {
  return new Promise((resolve, reject) => {
    argon2
      .verify(this.password, password)
      .then(match => resolve(match))
      .catch(err => reject(err));
  });
};

// Return an array of actions for the permission which matches the given
// resource name.
const findPermission = function (name) {
  return this.permissions.find(perm => (perm.name === name));
};

// Cut the resource matching `name` from the permissions array.
const removePermission = function (name) {
  const index = this.permissions.findIndex(permission => {
    return permission.name === name;
  });

  if (index >= 0) this.permissions.splice(index, 1);
};

// Replace the permissions for `resource` with `actions`, or add them if they
// don't already exist.
const addPermission = function ({ resource = {}, actions = [] }) {
  const validActions = [];

  // If permissions already exist for this resource, remove the old ones and
  // replace them with the new actions.
  this.removePermission(resource.name);

  // Filter actions to only include valid actions (i.e., strings which already
  // exist in resource.actions).
  if (resource.actions) {
    validActions = actions.filter(action => {
      return resource.actions.indexOf(action) >= 0;
    });
  }

  // Add a new permission with valid actions.
  // Accept an empty array of actions. The absence of a given action means it
  // will remove that permitted action from the user, regardless of what they
  // already had.
  this.permissions.push(new Permission({
    resourceId: resource.id,
    name: resource.name,
    actions: validActions
  }));
};

// Format permissions for use in a JWT access token, returning an object whose
// keys are the names of a resource which references an array of permissible
// actions.
// {
//    "my-amazing-resource": {
//      actions: ["read:active"]
//    },
//    "some-other-resource": {
//      actions: ["admin", "read:active", "write:new"]
//    }
// }
const tokenPermissions = modelPermissions => {
  return modelPermissions.reduce((acc, perm) => {
    return Object.assign(acc, { [perm.name]: perm.toJSON() });
  }, {});
};

// Generate limited data object for use in JWT token payload.
const tokenPayload = function () {
  return {
    userId: this.id,
    username: this.username,
    email: this.email,
    isActive: this.isActive,
    isAdmin: this.isAdmin,
    permissions: tokenPermissions(this.permissions)
  };
};

// More data returned in JSON form than in token payload.
const toJSON = function () {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    isActive: this.isActive,
    isSuperAdmin: this.isSuperAdmin,
    permissions: tokenPermissions(this.permissions),
    profile: this.profile,
    loginAt: this.loginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

Object.assign(UserSchema.methods, {
  verifyPassword,
  findPermission,
  removePermission,
  addPermission,
  tokenPayload,
  toJSON
});

module.exports = mongoose.model('User', UserSchema);

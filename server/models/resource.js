'use strict';

const mongoose = require('mongoose');
const URLSafe = require('urlsafe-base64');

// A "resource" in this context is a pointer to some resource in the cloud that
// will make use of this auth system. That is, some other server that will
// authenticate its requests using JWTs generated from this server and which
// uses the public-key for verifying the access-token.
//
// Resource servers can also, optionally, make use of a set of specific
// permission actions to manage a more granular authorization system. The
// `actions` array in the ResourceSchema is a list of strings which act as keys
// for possible permissions that the resource server understands (it can just
// be left blank too).
//
// NOTE: The permissions-based authorization only works if the resource server
// itself implements checks for those permitted actions on its endpoints. This
// server merely provides the facility for setting actions for a resource on
// the user's account and generates access-tokens which include them.
const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    unique: true,
    validate: {
      validator: URLSafe.validate,
      message: 'must be URL-safe (use hyphens instead of spaces, like "my-amazing-resource")'
    }
  },
  url: { type: String, required: true },
  actions: [String],
  isActive: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});

// Keep updatedAt current.
ResourceSchema.pre('save', next => {
  this.updatedAt = Date.now();

  next();
});

module.exports = mongoose.model('Resource', ResourceSchema);

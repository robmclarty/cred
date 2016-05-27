'use strict';

const mongoose = require('mongoose');
const URLSafe = require('urlsafe-base64');

// A small object type that contains a name (a unique identifier that is the
// name of a resource), and an array of strings representing permissible actions
// for that resource.
//
// NOTE: The name attribute is stored (in duplicate to the
// referenced resource itself) for performance reasons (e.g., there will be many
// more read operations than write operations, like when creating a token, so
// this stores everything that's needed for reading directly on the user
// document, but keeps a reference to the resource document through its id for
// verification).
const PermissionSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, require: true },
  name: {
    type: String,
    required: true,
    validate: {
      validator: URLSafe.validate,
      message: 'must be URL-safe (use hyphens instead of spaces, like "my-amazing-resource")'
    }
  },
  actions: [String]
}, {
  autoIndex: false
});

const toJSON = () => ({
  actions: this.actions
});

// Merge custom methods with UserSchema.methods.
Object.assign(PermissionSchema.methods, {
  toJSON
});

module.exports = mongoose.model('Permission', PermissionSchema);

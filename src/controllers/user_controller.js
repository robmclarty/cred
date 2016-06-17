'use strict';

const striptags = require('striptags');
const {
  createError,
  BAD_REQUEST
} = require('../helpers/error_helper');
const Resource = require('../models/resource');
const User = require('../models/user');

// Given a user object, check for any corresponding attributes in the request
// body and update the user object with those properties that the auth object
// (from req.auth) is allowed to change.
// NOTE: permissions are updated through a special endpoint just for that.
const updateUser = ({ auth = {}, targetUser = {}, updates = {} }) => {
  const user = targetUser;

  if (updates.hasOwnProperty('username')) {
    user.username = striptags(updates.username);
  }

  if (updates.hasOwnProperty('email')) {
    user.email = striptags(updates.email);
  }

  if (updates.hasOwnProperty('password')) {
    user.password = updates.password;
  }

  // Only super-admins can activate or de-activate users.
  if (updates.hasOwnProperty('isActive') && currentUser.isAdmin) {
    user.isActive = updates.isActive;
  }

  // Only other super-admins can assign super-admin status to a user.
  if (updates.hasOwnProperty('isAdmin') && currentUser.isAdmin) {
    user.isAdmin = updates.isAdmin;
  }

  return user;
};

const postUsers = (req, res, next) => {
  const newUser = updateUser({
    auth: req.auth,
    targetUser: new User(),
    updates: req.body
  });

  newUser
    .save()
    .then(() => {
      res.json({
        success: true,
        message: 'User created.',
        user: newUser
      });
    })
    .catch(err => next(err));
};

const getUsers = (req, res, next) => {
  User
    .find({})
    .then(users => {
      res.json({
        success: true,
        message: 'Users found.',
        users
      });
    })
    .catch(err => next(err));
};

const getUser = (req, res) => {
  User
    .findById(req.params.id)
    .then(user => {
      if (!user) {
        throw createError({
          status: BAD_REQUEST,
          message: `No user found with id '${ req.params.id }'`
        });
      }

      res.json({
        success: true,
        message: 'User found.',
        user
      });
    })
    .catch(err => next(err));
};

// Only allow updating of specific fields, check for their existence explicitly,
// and strip any html tags from String fields to mitigate XSS attacks.
const putUser = (req, res) => {
  User
    .findById(req.params.id)
    .then(user => {
      if (!user) {
        throw createError({
          status: BAD_REQUEST,
          message: `No user found with id '${ req.params.id }'`
        });
      }

      return updateUser({
        auth: req.auth,
        targetUser: user,
        updates: req.body
      });
    })
    .then(updatedUser => updatedUser.save())
    .then(updatedUser => {
      res.json({
        success: true,
        message: 'User updated.',
        user: updatedUser
      });
    })
    .catch(err => next(err));
};

const deleteUser = (req, res) => {
  User
    .findByIdAndRemove(req.params.id)
    .then(user => {
      if (!user) {
        throw createError({
          status: BAD_REQUEST,
          message: `No user found with id '${ req.params.id }'`
        });
      }

      res.json({
        success: true,
        message: 'User deleted.',
        user
      });
    })
    .catch(err => next(err));
};

// GET /users/:id/permissions/:resource_name
const getPermissions = (req, res, next) => {
  User
    .findById(req.params.id)
    .then(user => {
      if (!user) {
        throw createError({
          status: BAD_REQUEST,
          message: `No user found with id '${ req.params.id }'`
        });
      }
    })
    .then(Resource.findOne({ name: req.params.resource_name }))
    .then(resource => {
      if (!resource) {
        throw createError({
          status: BAD_REQUEST,
          message: `No resource found with name '${ req.params.resource_name }'`
        });
      }

      const permission = user.findPermission(resource.name);

      res.json({
        success: true,
        message: 'Permissions found.',
        actions: permission ? permission.actions : []
      });
    })
    .catch(err => next(err));
};

// POST /users/:id/permissions/:resource_name
const postPermissions = (req, res, next) => {
  User
    .findById(req.params.id)
    .then(user => {
      if (!user) {
        throw createError({
          status: BAD_REQUEST,
          message: `No user found with id '${ req.params.id }'`
        });
      }

      Resource
        .findOne({ name: req.params.resource_name })
        .then(resource => {
          if (!resource) {
            throw createError({
              status: BAD_REQUEST,
              message: `No resource found with name '${ req.params.resource_name }'`
            });
          }

          if (!req.body.actions) {
            throw createError({
              status: BAD_REQUEST,
              message: 'No actions provided.'
            });
          }

          // Old permissions are replaced with new ones.
          user.setPermission({
            resource,
            actions: req.body.actions
          });

          return user.save();
        })
        .then(user => {
          res.json({
            success: true,
            message: 'Permissions updated.',
            user
          });
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

// DELETE /users/:id/permissions/:resource_name
const deletePermissions = (req, res, next) => {
  User
    .findById(req.params.id)
    .then(user => {
      if (!user) {
        throw createError({
          status: BAD_REQUEST,
          message: `No user found with id '${ req.params.id }'`
        });
      }

      Resource
        .findOne({ name: req.params.resource_name })
        .then(resource => {
          if (!resource) {
            throw createError({
              status: BAD_REQUEST,
              message: `No resource found with name '${ req.params.resource_name }'`
            });
          }

          user.removePermission(resource.name);

          user
            .save()
            .then(() => {
              res.json({
                success: true,
                message: 'Permissions deleted.',
                user
              });
            })
            .catch(err => next(err));
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

Object.assign(exports, {
  postUsers,
  getUsers,
  getUser,
  putUser,
  deleteUser,
  getPermissions,
  postPermissions,
  deletePermissions
});

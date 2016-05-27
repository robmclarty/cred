'use strict';

const express = require('express');
const router = express.Router();
const {
  requireAdmin,
  requirePermission,
  requireOwner
} = require('../middleware/authorization_middleware');
const {
  postUsers,
  getUsers,
  getUser,
  putUser,
  deleteUser,
  getPermissions,
  postPermissions,
  deletePermissions
} = require('../controllers/user_controller');

// Only admins can create new users and list all users.
router.route('/users')
  .all(requireAdmin)
  .post(postUsers)
  .get(getUsers);

// Users can only get and change data for themselves, not any other users.
router.route('/users/:id')
  .all(requireOwner)
  .get(getUser)
  .put(putUser)
  .delete(deleteUser);

// Only users with the 'admin' action set for the given resource can change a
// user's permissions for that resource.
router.route('/users/:id/permissions/:resource_name')
  .all(requirePermission('admin'))
  .get(getPermissions)
  .post(postPermissions)
  .delete(deletePermissions);

module.exports = router;

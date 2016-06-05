'use strict';

const router = require('express').Router();
const {
  requireAdmin,
  requirePermission,
  requireOwner
} = require('../middleware/authorization_middleware');
const { requireValidAccessToken } = require('../middleware/token_middleware');
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

const userRoutes = path => {
  const usersPath = path || 'users';

  // Only admins can create new users and list all users.
  router.route(`${ usersPath }`)
    .all(requireValidAccessToken, requireAdmin)
    .post(postUsers)
    .get(getUsers);

  // Users can only get and change data for themselves, not any other users.
  router.route(`${ usersPath }/:id`)
    .all(requireValidAccessToken, requireOwner)
    .get(getUser)
    .put(putUser)
    .delete(deleteUser);

  // Only users with the 'admin' action set for the given resource can change a
  // user's permissions for that resource.
  router.route(`${ usersPath }/:id/permissions/:resource_name`)
    .all(requireValidAccessToken, requirePermission('admin'))
    .get(getPermissions)
    .post(postPermissions)
    .delete(deletePermissions);

  return router;
};

module.exports = userRoutes;

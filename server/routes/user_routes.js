'use strict';

let express = require('express');
let router = express.Router();
let userController = require('../controllers/user_controller');
let { requireAdmin, requireOwn } = require('../middleware/authorization_middleware');

// Only admins can create new users and list all users.
router.route('/users')
  .all(requireAdmin)
  .post(userController.postUsers)
  .get(userController.getUsers);

// Users can only get and change data for themselves, not any other users.
router.route('/users/:id')
  .all(requireOwn)
  .get(userController.getUser)
  .put(userController.putUser)
  .delete(userController.deleteUser);

module.exports = router;

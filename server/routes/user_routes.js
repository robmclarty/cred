'use strict';

let express = require('express');
let router = express.Router();
let userController = require('../controllers/user_controller');
let requireAdmin = require('../middleware/admin_middleware');

router.route('/users')
  .post(requireAdmin, userController.postUsers)
  .get(userController.getUsers);

router.route('/users/:id')
  .get(userController.getUser)
  .put(userController.putUser)
  .delete(userController.deleteUser);

module.exports = router;

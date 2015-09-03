var express = require('express');
var router = express.Router();
var userController = require('../controllers/user_controller');
var requireAdmin = require('../middleware/admin_middleware');
var requireValidToken = require('../middleware/token_middleware');

router.route('/users')
  .post(userController.postUsers) // TODO: put this behind requireValidToken after creating a way of making a defualt admin user without it
  .get(requireValidToken, userController.getUsers);

router.route('/users/:id')
  .all(requireValidToken)
  .get(userController.getUser)
  .put(userController.putUser)
  .delete(userController.deleteUser);

module.exports = router;

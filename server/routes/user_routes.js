var express = require('express');
var router = express.Router();
var userController = require('../controllers/user_controller');
var requireAdmin = require('../middleware/admin_middleware');

router.route('/users')
  .post(userController.postUsers)
  .get(userController.getUsers);

router.route('/users/:id')
  .get(userController.getUser)
  .put(userController.putUser)
  .delete(userController.deleteUser);

module.exports = router;

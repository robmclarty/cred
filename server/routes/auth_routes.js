var express = require('express');
var router = express.Router();
var authController = require('../controllers/auth_controller');

router.route('/authenticate')
  .post(authController.postAuthenticate);

router.route('/check')
  .get(authController.getCheck);

module.exports = router;

'use strict';

let express = require('express');
let router = express.Router();
let authController = require('../controllers/auth_controller');

router.route('/authenticate')
  .post(authController.postAuthenticate);

router.route('/session')
  .get(authController.getSession);

module.exports = router;

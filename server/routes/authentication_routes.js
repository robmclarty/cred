'use strict';

let express = require('express');
let router = express.Router();
let authController = require('../controllers/authentication_controller');

// Use "token" resource to handle authentication. POST = login, DELETE = logout.
router.route('/token')
  .post(authController.postToken)
  .delete(authController.deleteToken);

// Use "registration" resource to handle signups. This is separate from creating
// a "user" resource from the user_controller in that it is public-facing, to
// be used as part of a signup/registration process which goes hand-in-hand
// with the above authentication routes. Creating a user from the user_controller
// can then be reserved for different purposes such as internal administration.
router.route('/registration')
  .post(authController.postRegistration);

module.exports = router;

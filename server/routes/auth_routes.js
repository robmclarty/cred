'use strict';

let express = require('express');
let router = express.Router();
let authController = require('../controllers/auth_controller');

// Use "session" resource to handle authentication. POST = login, DELETE = logout.
router.route('/session')
  .post(authController.postSession)
  .get(authController.getSession)
  .delete(authController.deleteSession);

// Use "registration" resource to handle signups. This is separate from creating
// a "user" resource from the user_controller in that it is public facing to
// be used as part of a signup/registration process which goes hand-in-hand
// with the above authentication routes. Creating a user from the user_controller
// can then be reserved for different purposes such as internal administration.
router.route('/registration')
  .post(authController.postRegistration);

module.exports = router;

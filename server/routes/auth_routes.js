'use strict';

const express = require('express');
const router = express.Router();
const { requireValidRefreshToken } = require('../middleware/token_middleware');
const {
  postTokens,
  putTokens,
  deleteToken,
  postRegistration
} = require('../controllers/authentication_controller');

// Use "token" resource to handle authentication. POST = login, DELETE = logout.
router.route('/tokens')
  .post(postTokens)
  .put(requireValidRefreshToken, putTokens)
  .delete(requireValidRefreshToken, deleteToken);

// Use "registration" resource to handle signups. This is separate from creating
// a "user" resource from the user_controller in that it is public-facing and
// can be made more limited. It is to be used as part of a signup/registration
// process which goes hand-in-hand with the above authentication routes.
// Creating a user from the user_controller can then be reserved for different
// purposes such as internal administration.
router.route('/registration')
  .post(postRegistration);

module.exports = router;

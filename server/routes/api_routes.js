'use strict';

let express = require('express');
let router = express.Router();

// Base routes for /api.
router.route('/')
  .get(function (res, req) {
    res.json({
      success: true,
      message: 'Welcome to the API!'
    });
  });

module.exports = router;

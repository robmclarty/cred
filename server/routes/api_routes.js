'use strict';

let express = require('express');
let router = express.Router();

// Base routes for /api.
router.route('/')
  .get(function (res, req) {
    res.json({
      message: 'Welcome to the coolest API on earth!'
    });
  });

module.exports = router;

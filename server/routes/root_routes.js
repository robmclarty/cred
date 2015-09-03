var express = require('express');
var router = express.Router();

// Base routes for /api. These don't really do anything but are simply defined
// so that there is at least a response if they're hit.
router.route('/')
  .get(function (res, req) {
    res.json({
      message: 'Welcome to the coolest API on earth!'
    });
  });

module.exports = router;

'use strict';

let express = require('express');
let router = express.Router();

// Root route (aka homepage).
router.route('/')
  .get(function (req, res) {
    res.send('Hello! The API is at "/api"');
  });

module.exports = router;



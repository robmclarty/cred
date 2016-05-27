'use strict';

const express = require('express');
const router = express.Router();

// Homepage (replace with an html website if desired).
router.route('/')
  .get(function (req, res) {
    res.json({
      success: true,
      message: 'Welcome to the Authentik API!'
    });
  });

// Admin (this should never be hit in production as nginx should catch it first).
router.route('/admin/*')
  .get(function (req, res) {
    const assetsPath = req.app.get('assets-path');

    res.sendFile('admin/index.html', { root: assetsPath });
  });

module.exports = router;

'use strict';

let express = require('express');
let router = express.Router();
let resourceController = require('../controllers/resource_controller');

router.route('/resources')
  .post(resourceController.postResources)
  .get(resourceController.getResources);

router.route('/resources/:id')
  .get(resourceController.getResource)
  .put(resourceController.putResource)
  .delete(resourceController.deleteResource);

module.exports = router;

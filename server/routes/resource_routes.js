var express = require('express');
var router = express.Router();
var resourceController = require('../controllers/resource_controller');
var requireValidToken = require('../middleware/token_middleware');

router.route('/resources')
  .all(requireValidToken)
  .post(resourceController.postResources)
  .get(resourceController.getResources);

router.route('/resources/:id')
  .all(requireValidToken)
  .get(resourceController.getResource)
  .put(resourceController.putResource)
  .delete(resourceController.deleteResource);

module.exports = router;

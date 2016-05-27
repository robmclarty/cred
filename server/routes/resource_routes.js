'use strict';

const express = require('express');
const router = express.Router();
const {
  requireAdmin,
  requirePermission
} = require('../middleware/authorization_middleware');
const {
  postResources,
  getResources,
  getResource,
  putResource,
  deleteResource,
  postActions,
  getActions,
  deleteActions
} = require('../controllers/resource_controller');

router.route('/resources')
  .all(requireAdmin)
  .post(postResources)
  .get(getResources);

router.route('/resources/:resource_name')
  .all(requirePermission('admin'))
  .get(getResource)
  .put(putResource)
  .delete(deleteResource);

router.route('/resources/:resource_name/actions')
  .all(requirePermission('admin'))
  .post(postActions)
  .get(getActions)
  .delete(deleteActions);

module.exports = router;

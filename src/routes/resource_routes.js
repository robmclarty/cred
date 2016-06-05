'use strict';

const router = require('express').Router();
const {
  requireAdmin,
  requirePermission
} = require('../middleware/authorization_middleware');
const { requireValidAccessToken } = require('../middleware/token_middleware');
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

const resourceRoutes = path => {
  const resourcesPath = path || 'resources';

  router.route(`${ resourcesPath }`)
    .all(requireValidAccessToken, requireAdmin)
    .post(postResources)
    .get(getResources);

  router.route(`${ resourcesPath }/:resource_name`)
    .all(requireValidAccessToken, requirePermission('admin'))
    .get(getResource)
    .put(putResource)
    .delete(deleteResource);

  router.route(`${ resourcesPath }/:resource_name/actions`)
    .all(requireValidAccessToken, requirePermission('admin'))
    .post(postActions)
    .get(getActions)
    .delete(deleteActions);

  return router;
};

module.exports = resourceRoutes;

'use strict';

const striptags = require('striptags');
const URLSafe = require('urlsafe-base64');
const {
  createError,
  BAD_REQUEST,
  FORBIDDEN
} = require('../helpers/error_helper');
const Resource = require('../models/resource');

// Take an existing array of resource actions and merge them with a new array
// of actions. Filter out duplicates and strip any html tags to ensure that the
// array of actions returned is a set of safe, unique, strings.
const updatedActions = ({ resourceActions = [], actions = [] }) => {
  // Strip any tags in any of the actions and then filter the array to only
  // include new actions which don't already exist in resourceActions.
  const newActions = actions.map(action => striptags(action))
    .filter(action => (action !== '' && resourceActions.indexOf(action) < 0));

  // House cleaning: make sure there are no duplicates or empty strings in the
  // existing list of actions before saving the new actions into it. This
  // technique uses the array.reduce accumulator to build a new array from
  // checking if each element of app.actions already exists yet in it and
  // only adding unique values.
  // source: http://stackoverflow.com/a/15868720
  const uniqueActions = resourceActions.reduce((acc, action) => {
    if (acc.indexOf(action) < 0 && action !== '') {
      return [...acc, action];
    }

    return acc;
  }, []);

  return [...uniqueActions, ...actions];
};

const getResources = (req, res, next) => {
  Resource
    .find({})
    .then(resources => {
      res.json({
        success: true,
        message: 'Resources found.',
        resources
      });
    })
    .catch(err => next(err));
};

const postResources = (req, res, next) => {
  if (!req.body.name || !URLSafe.validate(req.body.name)) {
    next(createError({
      status: BAD_REQUEST,
      message: 'Badly formatted resource name; must be URLSafe.'
    }));
  }

  if (!req.body.url || !URLSafe.validate(req.body.url)) {
    next(createError({
      status: BAD_REQUEST,
      message: 'Badly formatted resource url.'
    }));
  }

  const resource = new Resource({
    name: striptags(req.body.name),
    url: striptags(req.body.url),
    actions: updatedActions({
      resourceActions: [],
      actions: req.body.actions
    })
  });

  Resource
    .findOne({ name: req.body.name })
    .then(existingResource => {
      if (existingResource) {
        throw createError({
          status: FORBIDDEN,
          message: 'An app by that name already exists.'
        });
      }

      return resource.save()
    })
    .then(() => {
      res.json({
        success: true,
        message: 'Resource created.',
        resource
      });
    })
    .catch(err => next(err));
};

const getResource = (req, res, next) => {
  Resource
    .findOne({ name: req.params.resource_name })
    .then(resource => {
      if (!resource) {
        throw createError({
          status: BAD_REQUEST,
          message: `No resource found with the name '${ req.params.resource_name }'`
        });
      }

      res.json({
        success: true,
        message: 'Resource found.',
        resource
      });
    })
    .catch(err => next(err));
};

// Only allow updates to explicitly defined fields. So, for example, actions
// need to be updated through their own endpoint and can't be changed here.
// Also, all html tags are stripped from string fields to prevent any kind
// of XSS attack.
const putResource = (req, res, next) => {
  if (!req.body.name || !URLSafe.validate(req.body.name)) {
    next(createError({
      status: BAD_REQUEST,
      message: 'Badly formatted resource name; must be URLSafe.'
    }));
  }

  Resource
    .findOne({ name: req.params.resource_name })
    .then(resource => {
      if (!resource) {
        throw createError({
          status: BAD_REQUEST,
          message: `No resource found with the name '${ req.params.resource_name }'.`
        });
      }

      if (req.body.hasOwnProperty('name')) {
        resource.name = striptags(req.body.name);
      }

      if (req.body.hasOwnProperty('url')) {
        resource.url = striptags(req.body.url);
      }

      if (req.body.hasOwnProperty('isActive')) {
        resource.isActive = req.body.isActive;
      }

      if (req.body.hasOwnProperty('actions')) {
        resource.actions = req.body.actions;
      }

      return resource.save();
    })
    .then(resource => {
      res.json({
        success: true,
        message: 'Resource updated',
        resource
      });
    })
    .catch(err => next(err));
};

// TODO: when deleting an resource, also cycle through all users and remove any
// references to the deleted resource from their permissions.
const deleteResource = (req, res, next) => {
  Resource
    .findOne({ name: req.params.resource_name })
    .then(resource => {
      if (!resource) {
        throw createError({
          status: BAD_REQUEST,
          message: `No resource found with the name '${ req.params.resource_name }'`
        });
      }

      return resource.remove();
    })
    .then(resource => {
      res.json({
        success: true,
        message: 'Resource deleted.',
        resource
      });
    })
    .catch(err => next(err));
};

const postActions = (req, res, next) => {
  Resource
    .findOne(req.params.resource_name)
    .then(resource => {
      if (!resource) {
        throw createError({
          status: BAD_REQUEST,
          message: `No resource found with the name '${ req.params.resource_name }'`
        });
      }

      // If no actions are provided, the existing actions will be returned.
      resource.actions = updatedActions({
        resourceActions: resource.actions,
        actions: req.body.actions
      });

      resource
        .save()
        .then(() => {
          res.json({
            success: true,
            message: 'Actions updated.',
            actions: resource.actions,
            resource
          });
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

const getActions = (req, res, next) => {
  Resource
    .findOne(req.params.resource_name)
    .then(resource => {
      if (!resource) {
        throw createError({
          status: BAD_REQUEST,
          message: `No resource found with the name '${ req.params.resource_name }'`
        });
      }

      res.json({
        success: true,
        message: 'Actions found.',
        actions: resource.actions,
        resource
      });
    })
    .catch(err => next(err));
};

// Requires a variable called "actions" which is an array of strings sent in the
// body containing a list of actions to be removed.
const deleteActions = (req, res, next) => {
  Resource
    .findOne(req.params.resource_name)
    .then(resource => {
      if (!resource) {
        throw createError({
          status: BAD_REQUEST,
          message: `No resource found with the name '${ req.params.resource_name }'`
        });
      }

      if (!req.body.actions || !Array.isArray(req.body.actions)) {
        throw createError({
          status: BAD_REQUEST,
          message: 'No actions were provided to be deleted.'
        });
      }

      // If an array of actions to be deleted was provided, cycle through each
      // of them, and remove those that match from resource.actions.
      resource.actions = req.body.actions.reduce((remainingActions, action) => {
        const index = remainingActions.indexOf(action);

        return [
          ...remainingActions.slice(0, index),
          ...remainingActions.slice(index + 1)
        ];
      }, [...resource.actions]);

      resource
        .save()
        .then(() => {
          res.json({
            success: true,
            message: 'Actions removed.',
            resource
          });
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

Object.assign(exports, {
  getResources,
  postResources,
  getResource,
  putResource,
  deleteResource,
  postActions,
  getActions,
  deleteActions
});

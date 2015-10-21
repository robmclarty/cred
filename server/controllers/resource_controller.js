'use strict';

exports.postResources = function (req, res, next) {
  let Resource = req.app.models.resource;
  let newResource = req.body;

  Resource.create(newResource, function (err, resource) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'Resource created.',
      resource: resource
    });
  });
};

exports.getResources = function (req, res, next) {
  let Resource = req.app.models.resource;

  Resource.find({}, function (err, resources) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'Resources found.',
      resources: resources
    });
  });
};

exports.getResource = function (req, res, next) {
  let Resource = req.app.models.resource;
  let resourceId = req.params.id;

  Resource.findOne({ id: resourceId }, function (err, resource) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'Resource found.',
      resource: resource
    });
  });
};

exports.putResource = function (req, res, next) {
  let Resource = req.app.models.resource;
  let updatedResource = req.body;
  let resourceId = req.params.id;

  Resource.update({ id: resourceId }, updatedResource, function (err, resource) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'Resource updated.',
      resource: resource
    });
  });
};

exports.deleteResource = function (req, res, next) {
  let Resource = req.app.models.resource;
  let resourceId = req.params.id;

  Resource.destroy({ id: resourceId }, function (err, resource) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'Resource deleted.',
      resource: resource
    });
  });
};

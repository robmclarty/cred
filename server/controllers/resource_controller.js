var Resource = require('../models/resource');

exports.postResources = function (req, res, next) {
  var resource = new Resource({
    name: req.body.name,
    description: req.body.description || '',
    notes: req.body.notes || ''
  });

  resource.save(function (err) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      message: 'New resource created.'
    });
  });
};

exports.getResources = function (req, res, next) {
  Resource.find({}, function (err, resources) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      resources: resources
    });
  });
};

exports.getResource = function (req, res, next) {
  Resource.findById(req.params.id, function (err, resource) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      resource: resource
    });
  });
};

exports.putResource = function (req, res, next) {
  var updatedResource = {
    name: req.body.name,
    description: req.body.description,
    notes: req.body.notes
  };

  Resource.findByIdAndUpdate(req.params.id, updatedResource, function (err, resource) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      resource: resource
    });
  });
};

exports.deleteResource = function (req, res, next) {


  Resource.findByIdAndRemove(req.params.id, function (err, resource) {
    if (err) {
      return next(err);
    }

    res.json({
      success: true,
      resource: resource
    })
  });
};

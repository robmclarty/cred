'use strict';

let { errorCodes } = require('../helpers/error_helper');

exports.unauthorized = function (err, req, res, next) {
  if (err.status !== errorCodes.unauthorized) {
    return next(err);
  }

  res.status(errorCodes.unauthorized).send({
    success: false,
    message: err.message || 'Unauthorized.',
    error: err
  });
};

exports.forbidden = function (err, req, res, next) {
  if (err.status !== errorCodes.forbidden) {
    return next(err);
  }

  res.status(errorCodes.forbidden).send({
    success: false,
    message: err.message || 'Forbidden.',
    error: err
  });
};

exports.badRequest = function (err, req, res, next) {
  if (err.status !== errorCodes.badRequest) {
    return next(err);
  }

  res.status(errorCodes.badRequest).send({
    success: false,
    message: err.message || 'Bad Request',
    error: err
  });
};

// If there's still an error at this point, return a generic 500 error.
exports.genericError = function (err, req, res, next) {
  res.status(errorCodes.genericError).send({
    success: false,
    message: err.message || 'Internal server error.',
    error: err
  });
};

// If there's nothing left to do after all this (and there's no error),
// return a 404 error.
exports.pageNotFound = function (req, res, next) {
  res.status(errorCodes.pageNotFound).send({
    success: false,
    message: 'Page not found.'
  });
};

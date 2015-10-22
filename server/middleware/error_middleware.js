'use strict';

// Simple helper method to create new errors with a specific status value
// attached to them, to match up with the codes and methods below.
exports.createError = function ({ status = 500, message = 'Something went wrong.' }) {
  let err = new Error(message);
  err.status = status;

  return err;
};

// Constants to be used throughout the app instead of hard-coding status values.
exports.codes = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  pageNotFound: 404,
  genericError: 500
};

exports.unauthorized = function (err, req, res, next) {
  if (err.status !== 401) {
    return next(err);
  }

  res.status(401).send({
    success: false,
    message: err.message || 'Unauthorized.',
    error: err
  });
};

exports.forbidden = function (err, req, res, next) {
  if (err.status !== 403) {
    return next(err);
  }

  res.status(403).send({
    success: false,
    message: err.message || 'Forbidden.',
    error: err
  });
};

exports.badRequest = function (err, req, res, next) {
  if (err.status !== 400) {
    return next(err);
  }

  res.status(400).send({
    success: false,
    message: err.message || 'Bad Request',
    error: err
  });
};

// If there's still an error at this point, return a generic 500 error.
exports.genericError = function (err, req, res, next) {
  res.status(500).send({
    success: false,
    message: err.message || 'Internal server error.',
    error: err
  });
};

// If there's nothing left to do after all this (and there's no error),
// return a 404 error.
exports.pageNotFound = function (req, res, next) {
  res.status(404).send({
    success: false,
    message: 'Page not found.'
  });
};

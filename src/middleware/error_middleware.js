'use strict';

const {
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  PAGE_NOT_FOUND,
  UNPROCESSABLE,
  GENERIC_ERROR
} = require('../helpers/error_helper');

const unauthorized = (err, req, res, next) => {
  if (err.status !== UNAUTHORIZED) return next(err);

  res.status(UNAUTHORIZED).send({
    success: false,
    message: err.message || 'Unauthorized.',
    error: err
  });
};

const forbidden = (err, req, res, next) => {
  if (err.status !== FORBIDDEN) return next(err);

  res.status(FORBIDDEN).send({
    success: false,
    message: err.message || 'Forbidden.',
    error: err
  });
};

const badRequest = (err, req, res, next) => {
  if (err.status !== BAD_REQUEST) return next(err);

  res.status(BAD_REQUEST).send({
    success: false,
    message: err.message || 'Bad Request',
    error: err
  });
};

const unprocessable = (err, req, res, next) => {
  if (err.status !== UNPROCESSABLE) return next(err);

  res.status(UNPROCESSABLE).send({
    success: false,
    message: err.message || 'Unprocessable entity.',
    error: err
  });
}

// If there's still an error at this point, return a generic 500 error.
const genericError = (err, req, res, next) => {
  res.status(GENERIC_ERROR).send({
    success: false,
    message: err.message || 'Internal server error.',
    error: err
  });
};

// If there's nothing left to do after all this (and there's no error),
// return a 404 error.
const pageNotFound = (req, res, next) => {
  res.status(PAGE_NOT_FOUND).send({
    success: false,
    message: 'Page not found.'
  });
};

Object.assign(exports, {
  unauthorized,
  forbidden,
  badRequest,
  unprocessable,
  genericError,
  pageNotFound
});

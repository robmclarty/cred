'use strict';

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const PAGE_NOT_FOUND = 404;
const UNPROCESSABLE = 422;
const GENERIC_ERROR = 500;

// Simple helper method to create new errors with a specific status value
// attached to them, to match up with the codes and methods below.
const createError = ({
  status = genericError,
  message = 'Something went wrong.'
}) => {
  const error = new Error(message);
  error.status = status;

  return error;
};

Object.assign(exports, {
  createError,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  PAGE_NOT_FOUND,
  UNPROCESSABLE,
  GENERIC_ERROR
});

'use strict';

const codes = {
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  pageNotFound: 404,
  genericError: 500
};

// Simple helper method to create new errors with a specific status value
// attached to them, to match up with the codes and methods below.
exports.createError = function ({
  status = codes.genericError,
  message = 'Something went wrong.'
}) {
  let err = new Error(message);
  err.status = status;

  return err;
};

// Constants to be used throughout the app instead of hard-coding status values.
exports.errorCodes = codes;

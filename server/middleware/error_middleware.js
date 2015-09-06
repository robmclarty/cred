exports.unauthorized = function (err, req, res, next) {
  if (err.status !== 403) {
    return next(err);
  }

  res.status(403).send({
    success: false,
    message: err.message || 'Unauthorized.',
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

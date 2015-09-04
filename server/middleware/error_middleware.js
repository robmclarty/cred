exports.pageNotFound = function (err, req, res, next) {
  if (err.status !== 404) {
    return next();
  }

  res.status(404).send({
    success: false,
    message: 'Page not found.',
    error: err
  });
};

exports.errorHandler = function (err, req, res, next) {
  console.error(err.stack);

  res.status(500).send({
    success: false,
    message: 'Internal server error.',
    error: err
  });
};

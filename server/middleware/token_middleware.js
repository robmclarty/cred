var jwt = require('jsonwebtoken');
var settings = require('../../config/settings');

module.exports = function (req, res, callback) {
  var apiSecret = req.app.get('api-secret');
  var token = req.body.token || req.param('token') || req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  } else {
    jwt.verify(token, apiSecret, function (err, decoded) {
      if (err) {
        return res.json({
          success: false,
          message: 'Failed to authenticate token.'
        });
      } else {
        req.decoded = decoded;
        callback();
      }
    });
  }
};

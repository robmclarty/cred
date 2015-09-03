var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var settings = require('../config/settings');
var User = require('./models/user');

// Config.
var port = process.env.PORT || 3000;
mongoose.connect(settings.database);
app.set('superSecret', settings.secret);

// Use body-parser to get info from POST and/or URL parameters.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Use morgan to log requests to the console.
app.use(morgan('dev'));

// Unauthenticated Routes
// =============================================================================
app.get('/setup', function (req, res) {
  var adminUser = new User({
    username: 'admin',
    password: 'password',
    admin: true
  });

  adminUser.save(function (err) {
    if (err) {
      throw err;
    }

    console.log('Admin user saved successfully.');

    res.json({ success: true });
  });
});

app.get('/', function (req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

var apiRoutes = express.Router();

// TODO: Implement encryption of password and use Passport to handle auth.
apiRoutes.post('/authenticate', function (req, res) {
  User.findOne({
    username: req.body.username
  }, function (err, user) {
    if (err) {
      throw err;
    }

    if (!user) {
      res.json({
        success: false,
        message: 'Authentication failed. User not found.'
      });
    } else {
      if (user.password !== req.body.password) {
        res.json({
          success: false,
          message: 'Authentication failed. Wrong password.'
        });
      } else {
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }
    }
  });
});

// Middleware to authenticate and check token.
apiRoutes.use(function (req, res, callback) {
  var token = req.body.token || req.param('token') || req.headers['x-access-token'];

  if (!token) {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  } else {
    jwt.verify(token, app.get('superSecret'), function (err, decoded) {
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
});

// Authenticated Routes
// =============================================================================
apiRoutes.get('/', function (req, res) {
  res.json({
    message: 'Welcome to the coolest API on earth!'
  });
});

apiRoutes.get('/users', function (req, res) {
  User.find({}, function (err, users) {
    res.json(users);
  });
});

apiRoutes.get('/check', function (req, res) {
  res.json(req.decoded);
});

app.use('/api', apiRoutes);

// Start the server.
app.listen(port);
console.log('Server started at http://localhost:' + port);

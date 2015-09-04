var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var config = require('./config');

var requireValidToken = require('./middleware/token_middleware');
var authRoutes = require('./routes/auth_routes');
var rootRoutes = require('./routes/root_routes');
var userRoutes = require('./routes/user_routes');
var resourceRoutes = require('./routes/resource_routes');

var errorHandler = require('./middleware/error_middleware').errorHandler;
var pageNotFound = require('./middleware/error_middleware').pageNotFound;

// Config.
var port = process.env.PORT || 3000;
mongoose.connect(config.database);
app.set('api-secret', config.secret);

// Use body-parser to get info from POST and/or URL parameters.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Use morgan to log requests to the console.
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes.
app.get('/', function (req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.use('/', authRoutes);

app.use('/api', [
  requireValidToken, // All API routes require a valid token.
  rootRoutes,
  userRoutes,
  resourceRoutes
]);

// Anything that didn't match the above routes, is a 404.
app.get('*', function (req, res, next) {
  var err = new Error();
  err.status = 404;

  next(err);
});

// Error handlers.
app.use(pageNotFound);
app.use(errorHandler);

// Start the server.
app.listen(port);
console.log('Server started at port ' + port);

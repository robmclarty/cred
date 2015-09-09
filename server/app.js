var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var config = require('./config');

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
var authRoutes = require('./routes/auth_routes');
var apiRoutes = require('./routes/api_routes');
var userRoutes = require('./routes/user_routes');
var resourceRoutes = require('./routes/resource_routes');
var requireValidToken = require('./middleware/token_middleware');

app.get('/', function (req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.use('/', authRoutes);

app.use('/api', [
  requireValidToken, // All API routes require a valid token.
  apiRoutes,
  userRoutes,
  resourceRoutes
]);

// Error handlers.
var errorHandler = require('./middleware/error_middleware');

app.use(errorHandler.unauthorized);
app.use(errorHandler.badRequest);
app.use(errorHandler.genericError);
app.use(errorHandler.pageNotFound);

// Start the server.
app.listen(port);
console.log('Server started at port ' + port);

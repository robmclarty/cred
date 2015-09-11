'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let morgan = require('morgan');
let mongoose = require('mongoose');
let config = require('./config');

// Config.
let app = express();
let port = process.env.PORT || 3000;

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
let authRoutes = require('./routes/auth_routes');
let apiRoutes = require('./routes/api_routes');
let userRoutes = require('./routes/user_routes');
let resourceRoutes = require('./routes/resource_routes');
let requireValidToken = require('./middleware/token_middleware');

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
let errorHandler = require('./middleware/error_middleware');

app.use(errorHandler.unauthorized);
app.use(errorHandler.badRequest);
app.use(errorHandler.genericError);
app.use(errorHandler.pageNotFound);

// Start the server.
app.listen(port);

console.log('Server started at port ' + port);

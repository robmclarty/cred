'use strict';

let express = require('express');
let bodyParser = require('body-parser');
let Waterline = require('waterline');
let config = require('./config');

// App.
let app = express();
let port = process.env.PORT || 3000;

// Store token config values in app object.
app.set('token-secret', config.token.secret);
app.set('token-issuer', config.token.issuer);
app.set('token-expires-in-seconds', config.token.expiresInSeconds);

// Database
let orm = new Waterline();

orm.loadCollection(require('./models/user'));
orm.loadCollection(require('./models/resource'));

// Use body-parser to get info from POST and/or URL parameters.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes.
let authenticationRoutes = require('./routes/authentication_routes');
let publicRoutes = require('./routes/public_routes');
let apiRoutes = require('./routes/api_routes');
let userRoutes = require('./routes/user_routes');
let resourceRoutes = require('./routes/resource_routes');
let { requireValidToken } = require('./middleware/token_middleware');

app.use('/', [
  authenticationRoutes,
  publicRoutes
]);

app.use('/api', [
  requireValidToken, // All API routes require a valid token.
  apiRoutes,
  userRoutes,
  resourceRoutes
]);

// Error handlers.
let errorHandler = require('./middleware/error_middleware');

app.use([
  errorHandler.unauthorized,
  errorHandler.forbidden,
  errorHandler.badRequest,
  errorHandler.genericError,
  errorHandler.pageNotFound
]);

// Initialize orm with database config and start server.
// Add orm models and connections to `app` object for convenience when
// performing queries from controllers.
orm.initialize(config.database, function (err, models) {
  if (err) {
    throw err;
  }

  app.models = models.collections;
  app.connections = models.connections;

  // Start the server.
  app.listen(port);

  console.log(`Server started at port ${port}`);
});

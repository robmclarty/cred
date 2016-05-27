'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const config = require('../config/server');

// App.
const app = express();

// Store token config values in app object.
app.set('token-issuer', config.tokens.issuer);
app.set('token-access-public-key', fs.readFileSync(config.tokens.access.publicKeyPath));
app.set('token-access-private-key', fs.readFileSync(config.tokens.access.privateKeyPath));
app.set('token-refresh-secret', config.tokens.refresh.secret);
app.set('token-access-expires-in', config.tokens.access.expiresIn);
app.set('token-refresh-expires-in', config.tokens.refresh.expiresIn);
app.set('token-access-alg', config.tokens.access.alg);
app.set('token-refresh-alg', config.tokens.refresh.alg);

// Logs
if (process.env.NODE_ENV === ('development' || 'test')) {
  app.use(morgan('dev'));
}

// Database
mongoose.connect(config.database);
mongoose.connection.on('error', (err) => console.log('Database Error: ', err));

// Use body-parser to get info from POST and/or URL parameters.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve static files from /public (on the production server, this is handled
// by nginx).
if (process.env.NODE_ENV === ('development' || 'test')) {
  app.use('/', express.static(`${ __dirname }/../public`));
}

// Routes.
const authRoutes = require('./routes/auth_routes');
const publicRoutes = require('./routes/public_routes');
const userRoutes = require('./routes/user_routes');
const resourceRoutes = require('./routes/resource_routes');
const { requireValidAccessToken } = require('./middleware/token_middleware');

app.use('/', [
  authRoutes,
  publicRoutes
]);

// All API routes require a valid token.
app.use('/', [
  requireValidAccessToken,
  userRoutes,
  resourceRoutes
]);

// Error handlers.
const {
  unauthorized,
  forbidden,
  badRequest,
  unprocessable,
  genericError,
  pageNotFound
} = require('./middleware/error_middleware');

app.use([
  unauthorized,
  forbidden,
  badRequest,
  unprocessable,
  genericError,
  pageNotFound
]);

module.exports = app;

'use strict';

const { readFileSync } = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const authentik = require('../src/authentik');
const morgan = require('morgan');
const authentikAuthorize = require('../src/authentik-authorize');
const User = require('./modesl/user');

app.set('name', 'my-app-name');
app.set('issuer', 'my-issuer-name');

app.use(bodyParser.json());

app.use(morgan('dev'));

const auth = authentik({
  issuer: 'my-issuer-name',
  cache: 'redis://localhost:6379',
  accessSecret: readFileSync('./keys/sample-private-key.pem'),
  accessExp: '24 hours',
  accessAlg: 'ES384', // ECDSA using P-384 curve and SHA-384 hash algorithm
  refreshSecret: 'my_super_secret_secret',
  refreshExp: '7 days',
  refreshAlg: 'HS512' // HMAC using SHA-512 hash algorithm
});

// Authorize refresh tokens to create new access tokens.
const authorizeRefresh = authentikAuthorize({
  issuer: 'my-issuer-name',
  secret: 'my_super_secret_secret',
  alg: 'HS512'
});

// Authorize access tokens for using resources (e.g., user accounts, etc.).
const authorizeAccess = authentikAuthorize({
  name: 'my-app-name',
  issuer: 'my-issuer-name',
  secret: readFileSync('./keys/sample-public-key.pem'),
  alg: 'ES384'
});

// Ultra simple authentication using hardcoded values.
// Resolves with a token payload, or an error message.
auth.use('basic', req => {
  return User
    .findOne({ username: req.body.username })
    .then(user => {
      if (user.username !== req.body.username) {
        throw 'Username and password do not match.';
      }
    })
});

// Return a javascript object to be used as the payload for all tokens.
// RECOMMENDED: Create a function on the user model that does this rather
// than explicitly defining it here.
auth.tokenPayload(user => {
  return {
    username: 'admin',
    id: '123456',
    isActive: true,
    permissions: {
      'my-app-name': {
        actions: ['action1', 'action2', 'actionN']
      }
    }
  };
});

// Get tokens from authenticated login.
app.post('/login', auth.authenticate('basic'), (req, res, next) => {
  console.log('auth: ', req['my-issuer-name'].tokens);
  res.json({
    message: 'Logged in.',
    tokens: req['my-issuer-name'].tokens
  });
});

// A custom endpoint with specific permission requirements.
app.use('/custom', authorizeAccess.requirePermission(['action1', 'action2']), (req, res, next) => {
  res.json({ message: 'made it' });
});

// Root endpoint
app.use('/', (req, res, next) => {
  res.json({ message: 'Welcome to the homepage!' });
});

// Use your own error handling
app.use((err, req, res, next) => {
  res.status(500).send({
    message: err.message || 'Internal server error.',
    error: err
  });
});

app.use((req, res, next) => {
  res.status(404).send({ message: 'Page not found.' });
});

// Start the server
app.listen(3000, () => {
  console.log(`Server started at port 3000`);
});

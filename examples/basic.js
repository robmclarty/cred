'use strict';

const { readFileSync } = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const authentik = require('../src/authentik');
const morgan = require('morgan');
const authentikAuthorize = require('../src/authentik-authorize');
const User = require('../src/models/user');

app.set('name', 'my-app-name');
app.set('issuer', 'my-issuer-name');

app.use(bodyParser.json());

app.use(morgan('dev'));


// Setup Auth
// ----------

const auth = authentik({
  issuer: app.get('issuer'),
  cache: 'redis://localhost:6379',
  accessToken: {
    key: readFileSync('./keys/sample-private-key.pem'),
    exp: '24 hours',
    alg: 'ES384', // ECDSA using P-384 curve and SHA-384 hash algorithm
  },
  refreshToken: {
    key: 'my_super_secret_secret',
    exp: '7 days',
    alg: 'HS512' // HMAC using SHA-512 hash algorithm
  }
});

// Authorize refresh tokens to create new access tokens.
const authorizedRefresh = authentikAuthorize({
  issuer: app.get('issuer'),
  key: 'my_super_secret_secret',
  alg: 'HS512'
});

// Authorize access tokens for using resources (e.g., user accounts, etc.).
const authorizedAccess = authentikAuthorize({
  name: 'my-app-name',
  issuer: app.get('issuer'),
  key: readFileSync('./keys/sample-public-key.pem'),
  alg: 'ES384'
});

// Ultra simple authentication using hardcoded values.
// Resolves with a token payload, or an error message.
auth.use('basic', req => {
  return Promise.resolve()
    .then(() => {
      if (req.body.username !== 'admin' ||
          req.body.password !== 'password') {
        throw 'Username and password do not match.';
      }

      // Return a javascript object to be used as the payload for all tokens.
      // RECOMMENDED: Create a function on the user model that does this rather
      // than explicitly defining it here.
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
});


// API Endpoints
// -------------

// Root endpoint
app.get('/', (req, res, next) => {
  res.json({ message: 'Welcome to the homepage!' });
});

// Get tokens from authenticated login.
app.post('/login', auth.authenticate('basic'), (req, res, next) => {
  console.log(auth.getCache());
  res.json({
    message: 'Logged in.',
    tokens: req[app.get('issuer')].tokens
  });
});

// A custom endpoint with specific permission requirements.
// authorizeAccess.requirePermission(['action1', 'action2'])
app.get(
  '/custom',
  authorizedAccess.requireValidToken,
  authorizedAccess.requirePermission('action1'),
  (req, res, next) => {
    res.json({ message: 'made it' });
  }
);

app.put('/refresh', authorizedRefresh.requireValidToken, (req, res, next) => {
  auth.refresh(req[app.get('issuer')].token)
    .then(freshTokens => {
      console.log(auth.getCache());
      res.json({
        message: 'Tokens refreshed.',
        tokens: freshTokens
      });
    })
    .catch(err => next(err));
});

app.delete('/revoke', authorizedRefresh.requireValidToken, (req, res, next) => {
  auth.revoke(req[app.get('issuer')].token)
    .then(revokedToken => {
      console.log(auth.getCache());
      res.json({
        message: 'Token revoked.',
        token: revokedToken
      });
    })
    .catch(err => next(err));
});


// Error Handling
// --------------

app.use((err, req, res, next) => {
  res.status(401).send({
    message: err.message || 'Not authorized.',
    error: err
  });
});

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
// ----------------

app.listen(3000, () => {
  console.log(`Server started at port 3000`);
});

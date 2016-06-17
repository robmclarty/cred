'use strict';

const { readFileSync } = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const authentik = require('../src/authentik');

app.use(bodyParser.json());

const auth = authentik({
  issuer: 'authentik',
  cache: 'redis://localhost:6379',
  accessSecret: readFileSync('./keys/sample-private-key.pem'),
  accessExp: '24 hours',
  accessAlg: 'ES384', // ECDSA using P-384 curve and SHA-384 hash algorithm
  refreshSecret: 'my_super_secret_secret',
  refreshExp: '7 days',
  refreshAlg: 'HS512' // HMAC using SHA-512 hash algorithm
});

// Ultra simple authentication using hardcoded values.
// Resolves with a token payload, or an error message.
auth.use('basic', req => new Promise((resolve, reject) => {
  if (req.body.username !== 'admin' || req.body.password !== 'password') {
    reject('Username and password do not match.');
  }

  // Return a simple token payload.
  resolve({
    username: 'admin',
    id: '123456',
    isActive: true
  });
}));

// Get tokens from authenticated login.
app.post('/login', auth.authenticate('basic'), (req, res, next) => {
  res.json({
    message: 'Logged in.',
    tokens: req.authentik.tokens
  });
});

app.use('/custom', (req, res, next) => {
  res.json({ message: 'made it' });
});

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

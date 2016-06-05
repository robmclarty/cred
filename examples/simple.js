'use strict';

const fs = require('fs');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const authentik = require('../src/authentik');
const authentikate = authentik(app);

// Use body-parser to get info from POST and/or URL parameters.
app.use(bodyParser.json());

// Setup Authentik.
authentikate({
  database: 'mongodb://localhost:27017/authentik',
  cache: 'redis://localhost:6379',
  tokens: {
    issuer: 'authentik',
    access: {
      privateKey: fs.readFileSync('config/sample-private-key.pem'),
      publicKey: fs.readFileSync('config/sample-public-key.pem'),
      expiresIn: '24 hours',
      algorithm: 'ES384', // ECDSA using P-384 curve and SHA-384 hash algorithm
    },
    refresh: {
      secret: 'my_super_secret_secret',
      expiresIn: '7 days',
      algorithm: 'HS512', // HMAC using SHA-512 hash algorithm
    }
  }
});

// Add your own middleware.
app.use('/', (req, res, next) => {
  res.json({ message: 'Welcome to the homepage!' });
});

app.use('/custom', (req, res, next) => {
  res.json({ message: 'This is a custom endpoint.' });
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

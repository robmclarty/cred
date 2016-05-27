'use strict';

//let LRU = require('lru-cache');
//let blacklist = LRU();
const jwt = require('jsonwebtoken'); // based on npm 'jws'
const jws = require('jws');
const shortid = require('shortid');

// Given a tokenId (jti claim), check if it exists in the jtiCache (the blacklist)
// and return true if it does. LRU will return 'undefined' if it cannot find
// the id in the cache.
const tokenIsRevoked = tokenId => {
  const blacklisted = blacklist.get(tokenId);

  // If token's ID is on the blacklist, the token is revoked.
  return typeof blacklisted !== 'undefined';
}

// If a bearer token has been sent in the authorization header, use that,
// otherwise, check if a token was sent in the request body, as a parameter, or
// part of the query string, or in the 'x-access-token' header.
// The authorization header is two string separated by a space, the first chunk
// being "Bearer" the second being the token, like `Authorization: Bearer <token>`.
const getTokenFromRequest = req => {
  if (req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }

  return req.headers['x-access-token'] ||
    req.body.token ||
    req.query.token;
};

// Blacklist (or revoke) a valid token until its expiration date has been
// reached. Once the token's expiration date has passed, it will be
// automatically removed from the blacklist so that only tokens that are still
// valid (but revoked) are stored in the cache. LRU handles removing expired
// tokens for us since we simply give each new entry a maxAge that is the time
// from now until the token's expiration date.
const revokeToken = ({ id = '', exp = 0, redis: {} }) => {
  return new Promise((resolve, reject) => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const maxAge = exp - nowInSeconds;

    // Add the token to the blacklist (i.e., add the jti to the cache).
    blacklist.set(id, id, maxAge);
    resolve();
  });
};

// Create a new token with the provided payload and return the generated token.
// Merge user-defined payload with some specific token claims (e.g., jti).
// See https://github.com/auth0/node-jsonwebtoken for errors generated
// by jsonwebtoken npm package.
const createToken = ({
  payload = {},
  issuer = '',
  secret = '',
  algorithm = 'HS256',
  expiresIn = 0,
}) => {
  return new Promise((resolve, reject) => {
    const extendedPayload = Object.assign({
      jti: shortid.generate()
    }, payload);
    const options = {
      issuer, // corresponds to verify() check
      algorithm,
      expiresIn
    };

    jwt.sign(extendedPayload, secret, options, (err, token) => {
      if (err || !token) reject(`Failed to create token: ${ err }`);

      resolve(token);
    });
  });
};

// Check if verify generates an error (e.g., if the token has expired, or
// doesn't match the issuer, or is otherwise invalid). Check if it has a `jti`
// claim (this implementation requires a unique identifier for each token so
// that they can optionally be revoked). Check if the token has already been
// revoked. If any of the above are true, then return the `done` callback with
// the error and a null payload, otherwise, return a null error and the
// decoded payload.
// See https://github.com/auth0/node-jsonwebtoken for errors generated
// by jsonwebtoken npm package.
const verifyToken = ({
  token = '',
  issuer = '',
  secret = '',
  algorithm = 'HS256'
}) => {
  return new Promise((resolve, reject) => {
    const options = {
      issuer,
      algorithms: [algorithm]
    };

    jwt.verify(token, secret, options, (err, payload) => {
      if (err || !payload) reject(`Failed to authenticate token: ${ err }`);

      resolve(payload);
    });
  });
};

Object.assign(exports, {
  createToken,
  verifyToken,
  revokeToken,
  getTokenFromRequest
});

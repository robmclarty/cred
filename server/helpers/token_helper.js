'use strict';

let LRU = require('lru-cache');
let blacklist = LRU();
let jwt = require('jsonwebtoken');
let uuid = require('node-uuid');

// Given a tokenId (jti claim), check if it exists in the jtiCache (the blacklist)
// and return true if it does. LRU will return 'undefined' if it cannot find
// the id in the cache.
function tokenIsRevoked(tokenId) {
  let blacklisted = blacklist.get(tokenId);

  // If token's ID is on the blacklist, the token is revoked.
  if (typeof blacklisted !== 'undefined') {
    return true;
  }

  return false;
}

// If a bearer token has been sent in the authorization header, use that,
// otherwise, check if a token was sent in the request body, as a parameter, or
// part of the query string, or in the 'x-access-token' header.
// The authorization header is two string separated by a space, the first chunk
// being "Bearer" the second being the token, like `Authorization: Bearer <token>`.
exports.getTokenFromRequest = function (req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  } else {
    return req.headers['x-access-token'] || req.body.token || req.query.token;
  }
}

// Blacklist (or revoke) a valid token until its expiration date has been
// reached. Once the token's expiration date has passed, it will be
// automatically removed from the blacklist so that only tokens that are still
// valid (but revoked) are stored in the cache. LRU handles removing expired
// tokens for us since we simply give each new entry a maxAge that is the time
// from now until the token's expiration date.
exports.revokeToken = function ({ id = '', exp = 0 }) {
  // Calculate the maxAge for the blacklisted token based on its expiration date.
  let nowInSeconds = Math.floor(Date.now() / 1000);
  let maxAge = exp - nowInSeconds;

  // Add the token to the blacklist (i.e., add the jti to the cache).
  blacklist.set(id, id, maxAge);
};

// Create a new token with the provided payload and return the generated token.
exports.createToken = function ({
  payload = {},
  secret = '',
  issuer = '',
  expiresInSeconds = 0
}) {
  // Merge user-payload with some some specific token claims.
  let payloadWithId = Object.assign({
    jti: uuid.v1() // generate time-based id -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'
  }, payload);

  // Make a new token and send it back.
  let token = jwt.sign(payloadWithId, secret, {
    algorithm: 'HS256',
    issuer: issuer, // corresponding verify() checks that issuer matches
    expiresIn: expiresInSeconds
  });

  return token;
};

exports.validateToken = function ({
  secret = '',
  issuer = '',
  token = ''
}, done) {
  jwt.verify(token, secret, { issuer: issuer }, function (err, decodedPayload) {
    let tokenId = decodedPayload.jti;

    if (err || !tokenId || tokenIsRevoked(tokenId)) {
      return done(err, null);
    }

    return done(null, decodedPayload);
  });
};

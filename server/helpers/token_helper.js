'use strict';

const jwt = require('jsonwebtoken'); // based on npm 'jws'
const jws = require('jws');
const shortid = require('shortid');

const REVOKED_TOKEN_LABEL = 'token:revoked';

// Given a tokenId (jti claim), check if it exists in the jtiCache (the blacklist)
// and return true if it does. LRU will return 'undefined' if it cannot find
// the id in the cache.
const checkBlacklist = ({ tokenId = '', redis = undefined }) => {
  return new Promise((resolve, reject) => {
    const blacklistedKey = `${ REVOKED_TOKEN_LABEL }:${ tokenId }`;

    // If Redis isn't working, don't verify tokens.
    if (!redis) reject('Cache server not accessible.');

    // If token's ID is found on the blacklist, the token is revoked.
    redis.get(blacklistedKey, (err, reply) => {
      if (err || reply !== null) reject('Token has been revoked.');

      // If token was not found on blacklist, it is still valid.
      resolve();
    });
  });
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
//
// TODO: Change this to a whitelist so that all issued tokens can be tracked and
// controlled (if desired). A blacklist has no control over issued tokens
// because it doesn't know about them out in the wild. So, for example, if an
// emergency "revoke all tokens" action is required, only a whiltelist could do
// that. Perhaps the blacklist is potentially faster, but at the cost of control.
const revokeToken = ({ tokenId = '', exp = 0, redis = undefined }) => {
  return new Promise((resolve, reject) => {
    const blacklistedKey = `${ REVOKED_TOKEN_LABEL }:${ tokenId }`;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const maxAge = exp - nowInSeconds;

    // Add the token to the blacklist (i.e., add the jti to the cache).
    if (redis) {
      redis.set(blacklistedKey, tokenId);
      redis.expire(blacklistedKey, maxAge);
    }

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
    const options = {
      jwtid: shortid.generate(), // jti claim
      issuer, // corresponds to verify() check
      algorithm,
      expiresIn
      //audience // the intended tenant (user-definable tenant name string or client id)
    };

    jwt.sign(payload, secret, options, (err, token) => {
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
  algorithm = 'HS256',
  redis = undefined
}) => {
  return new Promise((resolve, reject) => {
    const options = {
      issuer,
      algorithms: [algorithm]
    };

    // If there was an error, the payload is missing, the jti is missing, or
    // the token is not present in the Redis cache whitelist, reject verify.
    // Otherwise, resolve the payload.
    jwt.verify(token, secret, options, (err, payload) => {
      if (err ||
          !payload ||
          !payload.jti) {
        const msg = err ? err : 'Token missing id.';

        reject(`Failed to authenticate token: ${ msg }`);
      }

      checkBlacklist({ tokenId: payload.jti, redis })
        .then(resolve(payload))
        .catch(err => reject(`Failed to authenticate token: ${ err }`));
    });
  });
};

Object.assign(exports, {
  createToken,
  verifyToken,
  revokeToken,
  getTokenFromRequest
});

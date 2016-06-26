'use strict';

const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const lru = require('lru-cache');
const parambulator = require('parambulator');
const { setRedisClient } = require('./whitelist');

const TOKEN_CACHE_LABEL = 'authentik:token';
const EXCLUDED_JWT_CLAIMS = ['iss', 'exp', 'sub', 'aud', 'nbf', 'jti', 'iat'];

const authentication = ({
  issuer = 'cred',
  cache = 'memory',
  accessToken = {
    key: 'access-secret',
    exp: '24 hours',
    alg: 'HS256'
  },
  refreshToken = {
    key: 'refresh-secret',
    exp: '7 days',
    alg: 'HS256'
  }
}) => {
  // A set of functions to be used for verifying authentication and generating
  // token payloads.
  const strategies = {};

  const activeTokens = lru({
    max: 1000,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week (in milliseconds)
  });

  // Stores an authentication strategy (a function) which is defined by the user
  // and should return an object which will be passed into the tokenPayload
  // function.
  const use = (name, strategy) => {
    if (!name) throw new Error('Authentication strategies must have a name');
    if (!strategy) throw new Error('You must define a strategy');

    strategies[name] = strategy;

    return strategies;
  };

  const unuse = name => {
    delete strategies[name];

    return strategies;
  };

  const createError = (status, msg) => {
    const err = new Error(msg);

    err.status = status;

    return err;
  };

  // Returns a payload with the standard JWT claims stripped out which are used
  // in node-jsonwebtoken's `options` parameter. These claims cannot be in both
  // the payload and the options parameter so must be stripped from the payload
  // when signing new tokens.
  const excludeClaims = payload => {
    return Object.keys(payload).reduce((strippedPayload, key) => {
      return !EXCLUDED_JWT_CLAIMS.includes(key) ?
        Object.assign(strippedPayload, { [key]: payload[key] }) :
        strippedPayload;
    }, {});
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
  }) => new Promise((resolve, reject) => {
    const options = {
      jwtid: shortid.generate(), // jti claim
      issuer, // corresponds to verify() check
      algorithm,
      expiresIn
    };

    jwt.sign(excludeClaims(payload), secret, options, (err, token) => {
      if (err || !token) reject(`Failed to create token: ${ err }`);

      resolve(token);
    });
  });

  // Transform a payload into an object containing two tokens: `accessToken` and
  // `refreshToken`.
  const createAccessAndRefreshTokens = payload => {
    const accessTokenOptions = {
      payload,
      issuer,
      secret: accessToken.key,
      expiresIn: accessToken.exp,
      algorithm: accessToken.alg
    };
    const refreshTokenOptions = {
      payload,
      issuer,
      secret: refreshToken.key,
      expiresIn: refreshToken.exp,
      algorithm: refreshToken.alg
    };

    return Promise
      .all([
        createToken(accessTokenOptions),
        createToken(refreshTokenOptions)
      ])
      .then(tokens => ({
        payload,
        tokens: {
          accessToken: tokens[0],
          refreshToken: tokens[1]
        }
      }));
  };

  // Ensure that all payloads conform to the following rules:
  // 1. must contain an attribute called "permissions" which is an object
  // 2. may optionally contain any number of sub-attributes (to be used to
  //    reference specific apps/services) as long as they are uniquely named
  // 3. if a sub-attribute is present, it must contain an attribute called
  //    "actions" which is an array of permitted actions for that app/service
  // 4. actions must be strings which simply identify the permitted action
  //
  // Any other data can also be included along side permissions, or app-specific
  // permission attributes could be added to each sub-attribute if desired. But
  // the payload must at least conform to this minimum permissions format.
  const validatePayload = payload => {
    const payloadCheck = parambulator({
      permissions: {
        required$: true,

        '*': {
          actions: {
            required$: true,
            type$: 'array',

            '*': { type$: 'string' }
          }
        }
      }
    });

    return new Promise((resolve, reject) => {
      payloadCheck.validate(payload, err => {
        if (err) reject(`Payload is not formatted properly: ${ err }`);

        resolve(payload);
      });
    });
  };

  // Sets a token's id in the cache essentially "activating" it in a whitelist
  // of valid tokens. If an id is not present in this cache it is considered
  // "revoked" or "invalid".
  const register = token => new Promise((resolve, reject) => {
    const payload = jwt.decode(token);

    if (!payload.jti) reject('No Token ID.');
    if (!cache) reject('No cache defined.');

    const key = `${ TOKEN_CACHE_LABEL }:${ payload.jti }`;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const maxAge = payload.exp - nowInSeconds;

    switch(cache) {
    case 'redis':
      activeTokens.client.set(key, payload.jti);
      activeTokens.client.expire(key, maxAge);
      break;
    case 'memory': default:
      activeTokens.set(key, payload.jti, maxAge);
    }

    resolve(token);
  });

  // Remove a token's id from the cache essentially "deactivating" it from the
  // whitelist of valid tokens. If an id is not present in this cache it is
  // considered "revoked" or "invalid".
  const revoke = token => new Promise((resolve, reject) => {
    const payload = jwt.decode(token);

    if (!payload.jti) reject('No Token ID.');
    if (!cache) reject('No cache defined.');

    const key = `${ TOKEN_CACHE_LABEL }:${ payload.jti }`;

    switch(cache) {
    case 'redis':
      activeTokens.client.del(key);
      break;
    case 'memory': default:
      activeTokens.del(key);
    }

    resolve(token);
  });

  // Checks to see if the token's id exists in the cache (a whitelist) to
  // determine if the token can still be considered "active", or if it is "revoked".
  const verifyActive = token => new Promise((resolve, reject) => {
    const payload = jwt.decode(token);

    if (!payload.jti) reject('No Token ID.');
    if (!cache) reject('No cache defined.');

    switch(cache) {
    case 'redis':
      activeTokens.client.get(key, (err, reply) => {
        if (err || reply === null)
          reject('Token is no longer active.');
      });
      break;
    case 'memory': default:
      if (activeTokens.get(key) === 'undefined')
        reject('Token is no longer active.');
    }

    resolve(token);
  });

  const getCache = () => {
    switch(cache) {
    case 'redis':
      break;
    case 'memory': default:
      return activeTokens.dump();
    }
  };

  // Assuming the token (should be refresh token) has already been authorized,
  // create new access and refresh tokens.
  const refresh = token => new Promise((resolve, reject) => {
    createAccessAndRefreshTokens(jwt.decode(token))
      .then(results => {
        const { payload, tokens } = results;

        // Remove the old refresh token and register the newly created one.
        return Promise.all([
          tokens,
          revoke(token),
          register(tokens.refreshToken)
        ]);
      })
      .then(results => resolve(results[0])) // return tokens object
      .catch(err => reject(`Problem refreshing tokens: ${ err }`));
  });

  // Given a particular strategy, return Express middleware for authenticating.
  // If authenticated, attach an object called "authentik" to the req object
  // containing JWTs and other meta data for authentik.
  const authenticate = name => (req, res, next) => {
    if (!strategies[name]) next(createError(500, `Strategy "${ name }" not defined.`));

    strategies[name](req)
      .then(validatePayload)
      .then(createAccessAndRefreshTokens)
      .then(results => {
        const { payload, tokens } = results;

        req[issuer] = {
          strategy: name,
          payload,
          tokens
        };

        return register(tokens.refreshToken);
      })
      .then(() => next())
      .catch(msg => next(createError(401, msg)));
  };

  return {
    use,
    unuse,
    authenticate,
    verifyActive,
    getCache,
    revoke,
    register,
    refresh
  };
};

module.exports = authentication;

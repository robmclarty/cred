'use strict';

const jwt = require('jsonwebtoken');
const { setRedisClient } = require('./middleware/cache_middleware');

const TOKEN_CACHE_LABEL = 'authentik:token';

const authentik = ({
  issuer = 'authentik',
  cache = 'memory',
  accessSecret = 'access-secret',
  accessExp = '24 hours',
  accessAlg = 'HS256',
  refreshSecret = 'refresh-secret',
  refreshExp = '7 days',
  refreshAlg = 'HS256'
}) => {
  // A set of functions to be used for verifying authentication and generating
  // token payloads.
  const strategies = {};

  const activeTokens = lru({
    max: 1000,
    maxAge: 1000 * 60 * 60 * 24 * 7
  });

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

  // Given a particular strategy, return Express middleware for authenticating.
  // If authenticated, attach an object called "authentik" to the req object
  // containing JWTs and other meta data for authentik.
  const authenticate = name => (req, res, next) => {
    // TODO: check if strategy called 'name' exists.
    strategies[name](req)
      .then(payload => createTokens(payload))
      .then(({ payload, accessToken, refreshToken }) => {
        req[issuer] = {
          strategy: name,
          payload,
          tokens: { accessToken, refreshToken }
        };
        next();
      })
      .catch(msg => next(createError(401, msg)));
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

  // Transform a payload into an object containing two tokens: `accessToken` and
  // `refreshToken`.
  const createTokens = payload => {
    // TODO: assign standard token attributes based on initialize settings.
    // TODO: differentiate between "secret string" and "private key".
    const accessTokenOptions = {
      payload,
      issuer,
      secret: accessSecret,
      expiresIn: accessExp,
      algorithm: accessAlg
    };
    const refreshTokenOptions = {
      payload,
      issuer,
      secret: refreshSecret,
      expiresIn: refreshExp,
      algorithm: refreshAlg
    };

    return createToken(accessTokenOptions)
      .then(accessToken => createToken(refreshTokenOptions)
        .then(refreshToken => ({
          payload,
          accessToken,
          refreshToken
        }))
      );
  };

  const revoke = token => new Promise((resolve, reject) => {
    if (!token.jti) reject('No Token ID.');
    if (!cache) reject('No cache defined.');

    const payload = jwt.decode(token);
    const key = `${ TOKEN_CACHE_LABEL }:${ payload.jti }`;

    switch(cache) {
    case 'redis':
      activeTokens.client.del(key);
      break;
    case 'memory': default:
      activeTokens.del(key);
    }

    resolve();
  });

  // Checks to see if the token's id exists in the cache (a whitelist) to
  // determine if the token can still be considered "active", or if it is "revoked".
  const activate = token => new Promise((resolve, reject) => {
    if (!token.jti) reject('No Token ID.');
    if (!cache) reject('No cache defined.');

    const payload = jwt.decode(token);
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

    resolve();
  });

  const verifyActive = token => new Promise((resolve, reject) => {
    if (!token.jti) reject('No Token ID.');
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

    resolve();
  });

  return {
    use,
    unuse,
    authenticate,
    verifyActive,
    revoke,
    activate
  };
};

module.exports = authentik;

'use strict';

const jwt = require('jsonwebtoken');
const { createToken } = require('./helpers/token_helper');
const { setRedisClient } = require('./middleware/cache_middleware');

const authentik = ({ issuer = 'authentik', cache, accessOptions, refreshOptions } = {}) => {
  // A set of functions to be used for verifying authentication and generating
  // token payloads.
  const strategies = {};

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

  // Transform a payload into an object containing two tokens: `accessToken` and
  // `refreshToken`.
  const createTokens = payload => {
    // TODO: assign standard token attributes based on initialize settings.
    // TODO: differentiate between "secret string" and "private key".
    const accessTokenOptions = {
      payload,
      issuer,
      secret: accessOptions.privateKey || accessOptions.secret,
      expiresIn: accessOptions.expiresIn,
      algorithm: accessOptions.algorithm
    };
    const refreshTokenOptions = {
      payload,
      issuer,
      secret: refreshOptions.privateKey || refreshOptions.secret,
      expiresIn: refreshOptions.expiresIn,
      algorithm: refreshOptions.algorithm
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

  return {
    use,
    unuse,
    authenticate
  };
};

module.exports = authentik;

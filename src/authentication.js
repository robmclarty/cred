'use strict'

const jwt = require('jsonwebtoken')
const shortid = require('shortid')
const lru = require('lru-cache')
const { setRedisClient } = require('./whitelist')

const TOKEN_CACHE_LABEL = 'cred:token'
const EXCLUDED_JWT_CLAIMS = ['iss', 'exp', 'sub', 'nbf', 'jti', 'iat']
const SUBJECT = {
  ACCESS: 'access',
  REFRESH: 'refresh'
}

const cacheKeyFor = id => `${ TOKEN_CACHE_LABEL }:${ id }`

const authentication = ({
  key,
  issuer,
  cache,
  accessOpts = {
    secret,
    expiresIn,
    algorithm
  },
  refreshOpts = {
    secret,
    expiresIn,
    algorithm
  }
}) => {
  // A set of functions to be used for verifying authentication and generating
  // token payloads.
  const strategies = {}

  // TODO: Implement persistent storage (e.g., using Redis) as an alternative.
  const activeTokens = lru({
    max: 1000,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week (in milliseconds)
  })

  // Stores an authentication strategy (a function) which is defined by the user
  // and should return an object which will be passed into the tokenPayload
  // function.
  const use = (name, strategy) => {
    if (!name) throw new Error('Authentication strategies must have a name')
    if (!strategy) throw new Error('You must define a strategy')

    strategies[name] = strategy

    return strategies
  };

  const unuse = name => {
    delete strategies[name]

    return strategies
  };

  const createError = (status, msg) => {
    const err = new Error(msg)

    err.status = status

    return err
  };

  // Returns a payload with the standard JWT claims stripped out which are used
  // in node-jsonwebtoken's `options` parameter. These claims cannot be in both
  // the payload and the options parameter so must be stripped from the payload
  // when signing new tokens.
  const excludeClaims = payload => {
    return Object.keys(payload).reduce((strippedPayload, jwtKey) => {
      return !EXCLUDED_JWT_CLAIMS.includes(jwtKey) ?
        Object.assign(strippedPayload, { [jwtKey]: payload[jwtKey] }) :
        strippedPayload
    }, {})
  }

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
    subject = ''
  }) => new Promise((resolve, reject) => {
    const options = {
      jwtid: shortid.generate(), // jti claim
      issuer, // corresponds to verify() check
      algorithm,
      expiresIn,
      subject
    }

    // If this is a refresh token, don't include the permissions (not needed).
    if (subject === SUBJECT.REFRESH && payload && payload.permissions)
      delete payload.permissions

    jwt.sign(excludeClaims(payload), secret, options, (err, token) => {
      if (err || !token) reject(`Failed to create token: ${ err }`)

      resolve(token)
    })
  })

  const createAccessToken = payload => createToken({
    payload,
    issuer,
    secret: accessOpts.secret,
    expiresIn: accessOpts.expiresIn,
    algorithm: accessOpts.algorithm,
    subject: SUBJECT.ACCESS
  })

  const createRefreshToken = payload => createToken({
    payload,
    issuer,
    secret: refreshOpts.secret,
    expiresIn: refreshOpts.expiresIn,
    algorithm: refreshOpts.algorithm,
    subject: SUBJECT.REFRESH
  })

  // Transform a payload into an object containing two tokens: `accessToken` and
  // `refreshToken`.
  const createTokens = payload => Promise.all([
    createAccessToken(payload),
    createRefreshToken(payload)
  ])
    .then(tokens => ({
      payload,
      tokens: {
        accessToken: tokens[0],
        refreshToken: tokens[1]
      }
    }))

  // Sets a token's id in the cache essentially "activating" it in a whitelist
  // of valid tokens. If an id is not present in this cache it is considered
  // "revoked" or "invalid".
  const register = token => new Promise((resolve, reject) => {
    const payload = jwt.decode(token)

    if (!payload.jti) reject('No Token ID.')
    if (!cache) reject('No cache defined.')

    const cacheKey = cacheKeyFor(payload.jti)
    const nowInSeconds = Math.floor(Date.now() / 1000)
    const maxAge = payload.exp - nowInSeconds

    switch(cache) {
    case 'redis':
      activeTokens.client.set(cacheKey, payload.jti)
      activeTokens.client.expire(cacheKey, maxAge)
      break
    case 'memory': default:
      activeTokens.set(cacheKey, payload.jti, maxAge)
    }

    resolve(token)
  })

  // Remove a token's id from the cache essentially "deactivating" it from the
  // whitelist of valid tokens. If an id is not present in this cache it is
  // considered "revoked" or "invalid".
  const revoke = token => new Promise((resolve, reject) => {
    const payload = jwt.decode(token)

    if (!payload.jti) reject('No Token ID.')
    if (!cache) reject('No cache defined.')

    const cacheKey = cacheKeyFor(payload.jti)

    switch(cache) {
    case 'redis':
      activeTokens.client.del(cacheKey)
      break
    case 'memory': default:
      activeTokens.del(cacheKey)
    }

    resolve(token)
  })

  // Checks to see if the token's id exists in the cache (a whitelist) to
  // determine if the token can still be considered "active", or if it is "revoked".
  const verifyActive = token => new Promise((resolve, reject) => {
    const payload = jwt.decode(token)

    if (!payload.jti) reject('No Token ID.')
    if (!cache || !activeTokens) reject('No cache defined.')

    const cacheKey = cacheKeyFor(payload.jti)

    switch(cache) {
    case 'redis':
      activeTokens.client.get(cacheKey, (err, reply) => {
        if (err || reply === null) reject('Token has been revoked.')
      })
      break
    case 'memory': default:
      if (!activeTokens.get(cacheKey)) reject('Token has been revoked.')
    }

    resolve(payload)
  })

  // Verify that the token is valid and that, if it is a refresh token, it has
  // not yet expired.
  const verify = (token, secret, options) => new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, payload) => {
      if (err || !payload || !payload.jti)
        return reject(err)

      if (payload.sub && payload.sub === SUBJECT.REFRESH)
        return verifyActive(token)
          .then(() => resolve(payload))
          .catch(err => reject(err))

      resolve(payload)
    })
  })

  const getCache = () => {
    switch(cache) {
    case 'redis':
      break;
    case 'memory': default:
      return activeTokens.dump()
    }
  }

  // Assuming the token (should be refresh token) has already been authorized,
  // create new access and refresh tokens.
  const refresh = token => new Promise((resolve, reject) => {
    createTokens(jwt.decode(token))
      .then(results => {
        const { payload, tokens } = results

        // Remove the old refresh token and register the newly created one.
        return Promise.all([
          tokens,
          revoke(token),
          register(tokens.refreshToken)
        ])
      })
      .then(results => resolve(results[0])) // return tokens object
      .catch(err => reject(`Problem refreshing tokens: ${ err }`))
  })

  // Given a particular strategy, return Express middleware for authenticating.
  // If authenticated, attach an object called `req[key]` (`cred` by default)
  // to the req object containing JWTs and other meta data for cred.
  const authenticate = name => async (req, res, next) => {
    if (!strategies[name]) return next(createError(500, `Strategy "${ name }" not defined.`))

    try {
      const rawPayload = await strategies[name](req)
      const { payload, tokens } = await createTokens(rawPayload)

      // Register new refresh token with whitelisted cache.
      await register(tokens.refreshToken)

      req[key] = {
        strategy: name,
        payload,
        tokens
      }

      next()
    } catch (err) {
      next(createError(401, `Unauthorized: ${ err }`))
    }
  }

  return {
    use,
    unuse,
    authenticate,
    verifyActive,
    verify,
    getCache,
    revoke,
    register,
    refresh,
    createToken,
    createAccessToken,
    createRefreshToken
  }
}

module.exports = authentication

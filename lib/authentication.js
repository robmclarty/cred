const jwt = require('jsonwebtoken')
const { nanoid } = require('nanoid/async')
const makeAllowlist = require('./allowlist')

const TOKEN_CACHE_LABEL = 'cred:token'

const EXCLUDED_JWT_CLAIMS = ['iss', 'exp', 'sub', 'nbf', 'jti', 'iat']

const SUBJECTS = {
  access: 'access',
  refresh: 'refresh'
}

const cacheKeyFor = id => `${TOKEN_CACHE_LABEL}:${id}`

// create a new error and append a custom status to it
// TODO: move to common module
const createError = (status, msg) => {
  const error = new Error(msg)

  error.status = status

  return error
}

// Return a payload with the standard JWT claims stripped out which are used
// in node-jsonwebtoken's `options` parameter. These claims cannot be in both
// the payload and the options parameter so must be stripped from the payload
// when signing new tokens.
// Also remove 'permissions' if this is a refresh token (unnecessary data).
const excludeClaims = (payload, isRefresh) => {
  const payloadKeys = Object.keys(payload)

  // If this is a refresh token, don't include the permissions (not needed).
  const excludedKeys = isRefresh
    ? [...EXCLUDED_JWT_CLAIMS, 'permissions']
    : EXCLUDED_JWT_CLAIMS

  const sanitizedKeys = payloadKeys.reduce((sanitizedPayload, key) => {
    if (excludedKeys.includes(key)) return sanitizedPayload

    return {
      ...sanitizedPayload,
      [key]: payload[key]
    }
  }, {})

  return sanitizedKeys
}

// Create a new token with the provided payload and return the generated token.
// Merge user-defined payload with some specific token claims (e.g., jti).
// See https://github.com/auth0/node-jsonwebtoken for errors generated
// by jsonwebtoken npm package.
const createToken = async ({
  payload = {},
  issuer = '',
  secret = '',
  algorithm = 'HS256',
  expiresIn = 0,
  subject = '',
  idLength = 12 // see https://zelark.github.io/nano-id-cc/
}) => {
  // Generate id asynchronously to prevent any unforeseen blocking during
  // entropy collection (see https://github.com/ai/nanoid#async)
  const jwtid = await nanoid(idLength)

  const options = {
    jwtid, // jti claim
    issuer, // corresponds to verify() check
    algorithm,
    expiresIn,
    subject
  }

  const isRefresh = subject === SUBJECTS.refresh
    && payload
    && payload.permissions

  const sanitizedPayload = excludeClaims(payload, isRefresh)

  return new Promise((resolve, reject) => {
    jwt.sign(sanitizedPayload, secret, options, (error, token) => {
      if (error || !token) reject(new Error(`Failed to create token: ${error}`))

      resolve(token)
    })
  })
}

const authenticationFrom = ({
  key,
  issuer,
  cache,
  access: accessOpts = {},
  refresh: refreshOpts = {}
}) => {
  // A set of functions to be used for verifying authentication and generating
  // token payloads.
  const strategies = {}

  // A registry of currently active (allowed) jwtid values. If an id is not in
  // the allow list, its access_token will be rejected.
  const allowlist = makeAllowlist(cache)

  const init = async () => {
    await allowlist.init()
  }

  // Stores an authentication strategy (a function) which is defined by the user
  // and should return an object which will be passed into the tokenPayload
  // function.
  const use = (name, strategy) => {
    if (!name) throw new Error('Authentication strategies must have a name')
    if (!strategy) throw new Error('You must define a strategy')

    strategies[name] = strategy

    return strategies
  }

  const unuse = name => {
    delete strategies[name]

    return strategies
  }

  const decode = token => jwt.decode(token)

  // Sets a token's id in the cache essentially "activating" it in a whitelist
  // of valid tokens. If an id is not present in this cache it is considered
  // "revoked" or "invalid".
  const register = async token => {
    const payload = decode(token)

    if (!payload.jti) throw new Error('No token ID')
    if (!cache) throw new Error('No cache defined')

    const cacheKey = cacheKeyFor(payload.jti)
    const nowInSeconds = Math.floor(Date.now() / 1000)
    const maxAge = payload.exp - nowInSeconds

    await allowlist.add(cacheKey, payload.jti, maxAge)

    return token
  }

  // Remove a token's id from the cache essentially "deactivating" it from the
  // whitelist of valid tokens. If an id is not present in this cache it is
  // considered "revoked" or "invalid".
  const revoke = async token => {
    const payload = decode(token)

    if (!payload.jti) throw new Error('No token ID')
    if (!cache) throw new Error('No cache defined')

    const cacheKey = cacheKeyFor(payload.jti)

    await allowlist.remove(cacheKey)

    return token
  }

  // Checks to see if the token's id exists in the cache (a whitelist) to
  // determine if the token can still be considered "active", or if it is "revoked".
  const verifyActive = async token => {
    const payload = decode(token)

    if (!payload.jti) throw new Error('No token ID')
    if (!cache || !allowlist) throw new Error('No cache defined')

    const cacheKey = cacheKeyFor(payload.jti)
    const cachedTokenId = await allowlist.get(cacheKey)

    if (!cachedTokenId) throw new Error('Token has been revoked')

    return payload
  }

  // Verify that the token is valid and that, if it is a refresh token, it has
  // not yet expired.
  const verify = async (token, secret, options) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, options, async (error, payload) => {
        if (error || !payload || !payload.jti) return reject(error)

        if (payload.sub && payload.sub === SUBJECTS.refresh) {
          try {
            await verifyActive(token)
          } catch (error) {
            return reject(error)
          }
        }

        resolve(payload)
      })
    })
  }

  const getCache = async () => {
    return await allowlist.list()
  }

  // Return a new object so that internal strategies object cannot be externally mutated.
  const getStrategies = () => {
    return { ...strategies }
  }

  const createAccessToken = async payload => {
    const accessToken = await createToken({
      payload,
      issuer,
      secret: accessOpts.secret,
      expiresIn: accessOpts.expiresIn,
      algorithm: accessOpts.algorithm,
      subject: SUBJECTS.access
    })

    return accessToken
  }

  const createRefreshToken = async payload => {
    const refreshToken = await createToken({
      payload,
      issuer,
      secret: refreshOpts.secret,
      expiresIn: refreshOpts.expiresIn,
      algorithm: refreshOpts.algorithm,
      subject: SUBJECTS.refresh
    })

    // Register new refresh token with whitelisted cache.
    await register(refreshToken)

    return refreshToken
  }

  // Transform a payload into an object containing two tokens: `accessToken` and
  // `refreshToken`.
  const createTokens = async payload => {
    const [accessToken, refreshToken] = await Promise.all([
      createAccessToken(payload),
      createRefreshToken(payload)
    ])

    return {
      payload,
      tokens: {
        accessToken,
        refreshToken
      }
    }
  }

  // Assuming the token (should be refresh token) has already been authorized,
  // create new access and refresh tokens.
  const refresh = async token => {
    try {
      const { tokens } = await createTokens(decode(token))

      // Remove the old refresh token and register the newly created one.
      const results = await Promise.all([
        tokens,
        revoke(token),
        register(tokens.refreshToken)
      ])

      return results[0] // return tokens object
    } catch (error) {
      throw new Error(`Problem refreshing tokens: ${error}`)
    }
  }

  // Given a particular strategy, return Express middleware for authenticating.
  // If authenticated, attach an object called `req[key]` (`cred` by default)
  // to the req object containing JWTs and other meta data for cred.
  const authenticate = name => async (req, res, next) => {
    if (!strategies[name]) {
      return next(createError(500, `Strategy "${name}" not defined`))
    }

    try {
      const rawPayload = await strategies[name](req)
      const { payload, tokens } = await createTokens(rawPayload)

      req[key] = {
        strategy: name,
        payload,
        tokens
      }

      next()
    } catch (error) {
      next(createError(401, `Unauthorized: ${error}`))
    }
  }

  return {
    key,
    issuer,
    cache,
    accessOpts,
    refreshOpts,
    init,
    use,
    unuse,
    decode,
    authenticate,
    verifyActive,
    verify,
    getCache,
    getStrategies,
    revoke,
    register,
    refresh,
    createToken,
    createTokens,
    createAccessToken,
    createRefreshToken
  }
}

module.exports = authenticationFrom

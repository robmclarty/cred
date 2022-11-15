const authenticationFrom = require('./authentication')
const authorization = require('./authorization')

const DEFAULT_ALGORITHM = 'HS384'

const SUPPORTED_PUBLIC_KEY_ALGORITHMS = [
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
  'ES512'
]

const secretFrom = (opts = {}, isPrivate = false) => {
  const {
    secret = 'default-secret',
    privateKey = '',
    publicKey = '',
    algorithm = DEFAULT_ALGORITHM
  } = opts

  const key = isPrivate
    ? privateKey
    : publicKey

  return SUPPORTED_PUBLIC_KEY_ALGORITHMS.includes(algorithm)
    ? key
    : secret
}

/**
 * Create a new cred instance from options which will hold some internal state
 * within its closure for things like auth strats, and allow-list cache.
 */
const credFrom = async (options = {}) => {
  const {
    key = 'cred',
    resource = 'cred-auth-manager',
    issuer = 'cred-issuer',
    cache = 'memory',
    accessOpts = {
      secret: 'access-secret',
      privateKey: '',
      publicKey: '',
      expiresIn: '24 hours',
      algorithm: DEFAULT_ALGORITHM
    },
    refreshOpts = {
      secret: 'refresh-secret',
      privateKey: '',
      publicKey: '',
      expiresIn: '7 days',
      algorithm: DEFAULT_ALGORITHM
    }
  } = options

  const settings = {
    key,
    issuer,
    resource,
    cache,
    accessOpts,
    refreshOpts
  }

  const authentication = await authenticationFrom({
    key,
    issuer,
    cache,
    accessOpts: {
      secret: secretFrom(accessOpts, true),
      expiresIn: accessOpts.expiresIn,
      algorithm: accessOpts.algorithm
    },
    refreshOpts: {
      secret: secretFrom(refreshOpts, true),
      expiresIn: refreshOpts.expiresIn,
      algorithm: refreshOpts.algorithm
    }
  })

  const requirePermission = authorization.requirePermission(key, resource)

  const requireProp = authorization.requireProp(key)

  // TODO: verify token `sub` before trying anything else (must be "access")
  const requireAccessToken = authorization.requireValidToken(
    key,
    secretFrom(accessOpts),
    issuer,
    accessOpts.algorithm
  )

  // TODO: verify token `sub` before trying anything else (must be "refresh")
  const requireRefreshToken = authorization.requireValidToken(
    key,
    secretFrom(refreshOpts),
    issuer,
    refreshOpts.algorithm,
    authentication.verify
  )

  const authorizations = {
    requireAccessToken,
    requireRefreshToken,
    requirePermission,
    requireProp,
    tokenFromReq: authorization.tokenFromReq,
    createError: authorization.createError
  }

  return {
    ...settings,
    ...authentication,
    ...authorizations
  }
}

module.exports = credFrom

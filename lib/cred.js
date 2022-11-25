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

const secretFrom = (options = {}, isPrivate = false) => {
  const {
    secret = 'default-secret',
    privateKey = '',
    publicKey = '',
    algorithm = DEFAULT_ALGORITHM
  } = options

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
const credFrom = (options = {}) => {
  const {
    key = 'cred',
    issuer = 'cred-issuer',
    cache = 'memory',
    access = {
      secret: 'access-secret',
      privateKey: '',
      publicKey: '',
      expiresIn: '1 hour',
      algorithm: DEFAULT_ALGORITHM
    },
    refresh = {
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
    cache
  }

  const authentication = authenticationFrom({
    key,
    issuer,
    cache,
    access: {
      secret: secretFrom(access, true),
      expiresIn: access.expiresIn,
      algorithm: access.algorithm
    },
    refresh: {
      secret: secretFrom(refresh, true),
      expiresIn: refresh.expiresIn,
      algorithm: refresh.algorithm
    }
  })

  const requirePermission = authorization.requirePermission(key)

  const requireProp = authorization.requireProp(key)

  const getCred = authorization.getCred(key)

  // TODO: verify token `sub` before trying anything else (must be "access")
  const requireAccessToken = authorization.requireValidToken(
    key,
    secretFrom(access),
    issuer,
    access.algorithm
  )

  // TODO: verify token `sub` before trying anything else (must be "refresh")
  const requireRefreshToken = authorization.requireValidToken(
    key,
    secretFrom(refresh),
    issuer,
    refresh.algorithm,
    authentication.verify
  )

  const authorizations = {
    getCred,
    getToken: authorization.getToken,
    createError: authorization.createError,
    requireValidToken: authorization.requireValidToken,
    requireAccessToken,
    requireRefreshToken,
    requirePermission,
    requireProp
  }

  // Group all initialization routines here.
  const init = async () => {
    await authentication.init()
  }

  return {
    ...settings,
    ...authentication,
    ...authorizations,
    init
  }
}

module.exports = credFrom

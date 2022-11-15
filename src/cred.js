const initAuthentication = require('./authentication')
const {
  requireValidToken,
  requireResourcePermission,
  requirePropIn,
  createError,
  tokenFromReq
} = require('./authorization')

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

  const requirePermission = requireResourcePermission(key, resource)

  const requireProp = requirePropIn(key)

  const settings = {
    key,
    issuer,
    resource,
    cache,
    accessOpts,
    refreshOpts
  }

  const authentication = await initAuthentication({
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

  // TODO: verify token `sub` before trying anything else (must be "access")
  const requireAccessToken = requireValidToken(
    key,
    secretFromOpts(accessOpts),
    issuer,
    accessOpts.algorithm
  )

  // TODO: verify token `sub` before trying anything else (must be "refresh")
  const requireRefreshToken = requireValidToken(
    key,
    secretFromOpts(refreshOpts),
    issuer,
    refreshOpts.algorithm,
    authentication.verify
  )

  const authorization = {
    requireAccessToken,
    requireRefreshToken,
    requirePermission,
    requireProp,
    tokenFromReq,
    createError
  }

  return {
    ...settings,
    ...authentication,
    ...authorization
  }
}

module.exports = credFrom

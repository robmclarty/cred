'use strict'

const initAuthentication = require('./authentication')
const {
  requireValidToken,
  requireResourcePermission,
  createError,
  tokenFromReq
} = require('./authorization')

const cred = ({
  key = 'cred',
  resource = 'cred-auth-manager',
  issuer = 'cred-issuer',
  cache = 'memory',
  accessOpts = {
    secret: 'access-secret',
    privateKey: '',
    publicKey: '',
    expiresIn: '24 hours',
    algorithm: 'HS256'
  },
  refreshOpts = {
    secret: 'refresh-secret',
    privateKey: '',
    publicKey: '',
    expiresIn: '7 days',
    algorithm: 'HS256'
  }
}, authorizeOnly = false) => {
  const secretFromOpts = (opts = {}, isPrivate = false) =>
    ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'].includes(opts.algorithm) ?
      (isPrivate ? opts.privateKey : opts.publicKey) :
      opts.secret
  const requireAccessToken = requireValidToken(
    key,
    secretFromOpts(accessOpts),
    issuer,
    accessOpts.algorithm
  )
  const requirePermission = requireResourcePermission(key, resource)

  const settings = {
    key,
    issuer,
    resource,
    cache,
    accessOpts,
    refreshOpts
  }

  const authorization = {
    requireAccessToken,
    requirePermission,
    tokenFromReq,
    createError
  }

  const createAuthentication = () => {
    const auth = initAuthentication({
      key,
      issuer,
      cache,
      accessOpts: {
        secret: secretFromOpts(accessOpts, true),
        expiresIn: accessOpts.expiresIn,
        algorithm: accessOpts.algorithm
      },
      refreshOpts: {
        secret: secretFromOpts(refreshOpts, true),
        expiresIn: refreshOpts.expiresIn,
        algorithm: refreshOpts.algorithm
      }
    })
    const requireRefreshToken = requireValidToken(
      key,
      secretFromOpts(refreshOpts),
      issuer,
      refreshOpts.algorithm,
      auth.verify
    )

    // Add requireRefreshToken() to authorization in the case that both
    // authorization + authentication are used.
    Object.assign(authorization, { requireRefreshToken })

    return {
      use: auth.use,
      unuse: auth.unuse,
      authenticate: auth.authenticate,
      verifyActive: auth.verifyActive,
      verify: auth.verify,
      getCache: auth.getCache,
      revoke: auth.revoke,
      register: auth.register,
      refresh: auth.refresh
    }
  }

  if (authorizeOnly) return Object.assign(settings, authorization)

  // Must createAuthentication() before assigning final return object so that
  // the authorization object gets updated with requireRefreshToken() which
  // depends on the authentication instance.
  const authentication = createAuthentication()

  return Object.assign(settings, authentication, authorization)
}

module.exports = cred;

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
  const requireAccessToken = requireValidToken(key, secretFromOpts(accessOpts), issuer, accessOpts.algorithm)
  const requireRefreshToken = requireValidToken(key, secretFromOpts(refreshOpts), issuer, refreshOpts.algorithm)
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
    requireRefreshToken,
    requirePermission,
    tokenFromReq,
    createError
  }

  const authentication = () => {
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

    return {
      use: auth.use,
      unuse: auth.unuse,
      authenticate: auth.authenticate,
      verifyActive: auth.verifyActive,
      getCache: auth.getCache,
      revoke: auth.revoke,
      register: auth.register,
      refresh: auth.refresh
    }
  }

  if (authorizeOnly) return Object.assign(settings, authorization)

  return Object.assign(settings, authentication(), authorization)
}

module.exports = cred;

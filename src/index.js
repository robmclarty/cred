'use strict'

const initAuthentication = require('./authentication')
const {
  requireValidToken,
  requireResourcePermission,
  requirePropIn,
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
}) => {
  const secretFromOpts = (opts = {}, isPrivate = false) =>
    ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'].includes(opts.algorithm) ?
      (isPrivate ? opts.privateKey : opts.publicKey) :
      opts.secret
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

  const authentication = initAuthentication({
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

  return Object.assign(settings, authentication, authorization)
}

module.exports = cred;

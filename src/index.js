'use strict'

const credFrom = require('./cred')


module.exports = {
  init,
  getCred,
  authenticate,
  use,
  unuse,
  decode,
  verify,
  revoke,
  register,
  refresh,
  createToken,
  requirePermission,
  requireProp,
  requireToken
}

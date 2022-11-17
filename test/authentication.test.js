const assert = require('assert').strict
const crypto = require('crypto')
const credFrom = require('../lib')

const testConfig = {
  key: 'test-cred',
  resource: 'test-resource',
  issuer: 'test-cred-issuer',
  cache: 'memory',
  access: {
    secret: 'test-access-secret',
    expiresIn: '1 day',
    algorithm: 'HS384'
  },
  refresh: {
    secret: 'test-refresh-secret',
    expiresIn: '2 days',
    algorithm: 'HS384'
  }
}

const testPayload = {
  userId: 123,
  testAttr: 'test attribute',
  permissions: [
    'read:users',
    'write:users',
    'read:status'
  ]
}

describe('Authentication', () => {
  const cred = credFrom(testConfig)

  beforeAll(async () => {
    await cred.init()
  })

  test('init', () => {
    assert.equal(cred.key, testConfig.key)
    assert.equal(cred.issuer, testConfig.issuer)
  })

  test('uses strategy', () => {
    const name = 'test-strat'
    const msg = 'this is the test strat'

    cred.use(name, () => msg)

    const strategies = cred.getStrategies()

    assert(Object.keys(strategies).includes(name))
    assert.equal(strategies[name](), msg)
  })

  test('un-uses strategy', () => {
    const name = 'test-strat'
    const msg = 'this is the test strat'

    cred.use(name, () => msg)

    const strategies = cred.getStrategies()

    assert(Object.keys(strategies).includes(name))

    cred.unuse(name)

    const updatedStrategies = cred.getStrategies()

    assert(!Object.keys(updatedStrategies).includes(name))
  })

  test('create raw token', async () => {
    const secret = 'my-test-secret'
    const algorithm = 'HS384'
    const token = await cred.createToken({
      payload: testPayload,
      issuer: testConfig.issuer,
      secret,
      algorithm
    })

    const tokenParts = token.split('.')
    const headers = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString('utf8'))
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'))
    const signature = tokenParts[2]
    const hash = crypto.createHmac('sha384', secret)
      .update(`${tokenParts[0]}.${tokenParts[1]}`)
      .digest('base64')
      .replace(/=/g, '') // these replacements are being made in the underlying `jws` package: https://github.com/auth0/node-jws/blob/master/lib/sign-stream.js#L13
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    // Headers
    assert.equal(headers.alg, algorithm)

    // Payload
    assert.equal(payload.iss, testConfig.issuer)
    assert.equal(typeof payload.jti, 'string')
    assert.notEqual(payload.jti, '') // json web token id should have a non-empty value
    assert.equal(payload.userId, testPayload.userId)
    assert.equal(payload.testAttr, testPayload.testAttr)
    assert.equal(payload.iat, payload.exp) // default `expiresIn` is 0, so these should be equal
    assert.equal(payload.sub, '') // default is an empty string

    // Signature
    assert.equal(signature, hash)
  })

  test('create access token', async () => {
    const token = await cred.createAccessToken(testPayload)

    const tokenParts = token.split('.')
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'))

    assert.equal(payload.sub, 'access')
    assert(Object.keys(payload).includes('permissions'))
    assert(Array.isArray(payload.permissions))
    assert(payload.permissions.includes('read:users'))
  })

  test('create refresh token', async () => {
    const token = await cred.createRefreshToken(testPayload)

    const tokenParts = token.split('.')
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8'))

    assert.equal(payload.sub, 'refresh')
    assert(!Object.keys(payload).includes('permissions'))
  })

  test('create access/refresh tokens', async () => {
    const { payload, tokens } = await cred.createTokens(testPayload)

    assert.deepEqual(payload, testPayload)
    assert(Object.keys(tokens).includes('accessToken'))
    assert(Object.keys(tokens).includes('refreshToken'))

    const accessTokenParts = tokens.accessToken.split('.')
    const accessPayload = JSON.parse(Buffer.from(accessTokenParts[1], 'base64').toString('utf8'))

    assert.equal(accessPayload.iss, testConfig.issuer)
    assert.equal(accessPayload.sub, 'access')
    assert(Object.keys(payload).includes('permissions'))
    assert(Array.isArray(payload.permissions))
    assert(payload.permissions.includes('read:users'))

    const refreshTokenParts = tokens.refreshToken.split('.')
    const refreshPayload = JSON.parse(Buffer.from(refreshTokenParts[1], 'base64').toString('utf8'))

    assert.equal(refreshPayload.iss, testConfig.issuer)
    assert.equal(refreshPayload.sub, 'refresh')
    assert(!Object.keys(refreshPayload).includes('permissions'))
  })

  test('register', async () => {
    const secret = 'my-test-secret'
    const algorithm = 'HS384'
    const token = await cred.createToken({
      payload: testPayload,
      issuer: testConfig.issuer,
      secret,
      algorithm,
      expiresIn: '1 day'
    })
    const payload = cred.decode(token)
    const registeredToken = await cred.register(token)
    const registeredPayload = cred.decode(registeredToken)

    assert(registeredToken)
    assert.equal(registeredPayload.jti, payload.jti)

    const allowList = await cred.getCache()

    // WARNING: this is specific to the memory/lru cache (NOT redis)
    const cachedToken = allowList.find(el => el[1].value === payload.jti)

    assert(cachedToken)
  })

  test('verify valid token', async () => {
    const secret = 'my-test-secret'
    const algorithm = 'HS384'
    const token = await cred.createToken({
      payload: testPayload,
      issuer: testConfig.issuer,
      secret,
      algorithm,
      expiresIn: '1 day'
    })
    const isValid = await cred.verify(token, secret)

    assert(isValid)
  })

  // Default `expiresIn` is current timestamp (which should be immediately invalid).
  test('verify expired token', async () => {
    const secret = 'my-test-secret'
    const algorithm = 'HS384'
    const token = await cred.createToken({
      payload: testPayload,
      issuer: testConfig.issuer,
      secret,
      algorithm
    })

    try {
      await cred.verify(token, secret)
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /TokenExpiredError/)
    }
  })

  test('verify access token', async () => {
    const token = await cred.createAccessToken(testPayload)
    const isValid = await cred.verify(token, testConfig.access.secret)

    assert(isValid)
  })

  // Refresh tokens must not only be valid JWTs but must also currently exist in
  // the allow-list.
  test('verify refresh token', async () => {
    const token = await cred.createRefreshToken({
      ...testPayload,
      expiresIn: '1 day'
    })
    const isValid = await cred.verify(token, testConfig.refresh.secret)

    assert(isValid)
  })

  test('verify token is active', async () => {
    const secret = 'my-test-secret'
    const algorithm = 'HS384'
    const token = await cred.createToken({
      payload: testPayload,
      issuer: testConfig.issuer,
      secret,
      algorithm,
      expiresIn: '1 day'
    })

    await cred.register(token)

    const isActive = await cred.verifyActive(token)

    assert(isActive)
  })

  // Do NOT register token in cache (should act as if revoked).
  test('verify token is NOT active', async () => {
    const secret = 'my-test-secret'
    const algorithm = 'HS384'
    const token = await cred.createToken({
      payload: testPayload,
      issuer: testConfig.issuer,
      secret,
      algorithm
    })

    try {
      await cred.verifyActive(token)
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /Token has been revoked/)
    }
  })

  test('verify expired token is NOT active', async () => {
    const secret = 'my-test-secret'
    const algorithm = 'HS384'
    const token = await cred.createToken({
      payload: testPayload,
      issuer: testConfig.issuer,
      secret,
      algorithm,
      expiresIn: -100
    })

    await cred.register(token)

    try {
      await cred.verifyActive(token)
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /Token has been revoked/)
    }
  })

  test('refresh', async () => {
    const { tokens } = await cred.createTokens(testPayload)
    const refreshedTokens = await cred.refresh(tokens.refreshToken)

    assert(Object.keys(refreshedTokens).includes('refreshToken'))
    assert(Object.keys(refreshedTokens).includes('accessToken'))
    assert.notEqual(refreshedTokens.refreshToken, tokens.refreshToken)

    try {
      // old refresh token should have been revoked
      await cred.verify(tokens.refreshToken, testConfig.refresh.secret)
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /Token has been revoked/)
    } finally {
      // new refresh token should be active (in the cache)
      const newTokenIsActive = await cred.verify(refreshedTokens.refreshToken, testConfig.refresh.secret)
      assert(newTokenIsActive)
    }
  })

  test('revoke', async () => {
    const token = await cred.createRefreshToken({
      ...testPayload,
      expiresIn: '1 day'
    })

    const isActive = await cred.verifyActive(token)
    assert(isActive)

    const revokedToken = await cred.revoke(token)
    assert.equal(revokedToken, token)

    try {
      await cred.verify(token, testConfig.refresh.secret)
    } catch (error) {
      assert.match(error.toString(), /Token has been revoked/)
    }
  })

  test('authenticate', async () => {
    const mockRequest = {}
    const testPayload = {
      testAttr: 'example test attribute'
    }

    cred.use('test-basic', req => testPayload)

    await cred.authenticate('test-basic')(mockRequest, {}, () => {})

    const { strategy, payload, tokens } = mockRequest[testConfig.key]

    assert.equal(strategy, 'test-basic')
    assert.deepEqual(payload, testPayload)

    const isValidAccessToken = await cred.verify(tokens.accessToken, testConfig.access.secret)
    assert(isValidAccessToken)

    const isValidRefreshToken = await cred.verify(tokens.refreshToken, testConfig.refresh.secret)
    assert(isValidRefreshToken)
  })
})

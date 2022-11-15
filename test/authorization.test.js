const assert = require('assert').strict
const credFrom = require('../src/cred')

const testConfig = {
  key: 'test-cred',
  resource: 'test-resource',
  issuer: 'test-cred-issuer',
  cache: 'memory',
  accessOpts: {
    secret: 'test-access-secret',
    expiresIn: '1 day',
    algorithm: 'HS384'
  },
  refreshOpts: {
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

const mockRequestFrom = token => {
  return {
    headers: {
      authorization: `Bearer ${token}`
    }
  }
}

describe('Authorization', () => {
  let cred
  let testAccessToken
  let testRefreshToken

  beforeAll(async () => {
    cred = await credFrom(testConfig)
    testAccessToken = await cred.createAccessToken(testPayload)
    testRefreshToken = await cred.createRefreshToken(testPayload)
  })

  test('get token from request', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)
    const reqToken = cred.getTokenFrom(mockRequest)

    assert.equal(reqToken, testAccessToken)
  })

  test('get cred from request', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)

    await cred.requireAccessToken(mockRequest, {}, () => {})

    const { payload, token } = cred.getCredFrom(mockRequest)

    assert.equal(token, testAccessToken)
    assert.equal(payload.sub, 'access')
    assert.equal(payload.userId, testPayload.userId)
    assert.deepEqual(payload.permissions, testPayload.permissions)
  })

  test('require access token', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)

    await cred.requireAccessToken(mockRequest, {}, () => {})

    const { payload } = cred.getCredFrom(mockRequest)

    assert.equal(payload.sub, 'access')
    assert.equal(payload.userId, testPayload.userId)
    assert.deepEqual(payload.permissions, testPayload.permissions)
  })

  test('require access token with missing token', async () => {
    const mockRequest = mockRequestFrom('')

    try {
      await cred.requireAccessToken(mockRequest, {}, error => {
        throw error
      })
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /No token provided/)
    }
  })

  test('require access token with invalid signature', async () => {
    const token = await cred.createToken({
      ...testConfig.accessOpts,
      secret: 'invalid secret',
      subject: 'access',
      issuer: cred.issuer,
      payload: testPayload
    })
    const mockRequest = mockRequestFrom(token)

    try {
      await cred.requireAccessToken(mockRequest, {}, error => {
        throw error
      })
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /invalid signature/)
    }
  })

  test('require refresh token', async () => {
    const mockRequest = mockRequestFrom(testRefreshToken)

    await cred.requireRefreshToken(mockRequest, {}, () => {})

    const { payload } = cred.getCredFrom(mockRequest)

    assert.equal(payload.sub, 'refresh')
    assert.equal(payload.userId, testPayload.userId)
    assert.deepEqual(payload.permissions, undefined)
  })

  test('require refresh token with missing token', async () => {
    const mockRequest = mockRequestFrom('')

    try {
      await cred.requireRefreshToken(mockRequest, {}, error => {
        throw error
      })
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /No token provided/)
    }
  })

  test('require refresh token with invalid signature', async () => {
    const token = await cred.createToken({
      ...testConfig.refreshOpts,
      secret: 'invalid secret',
      subject: 'refresh',
      issuer: cred.issuer,
      payload: testPayload
    })
    const mockRequest = mockRequestFrom(token)

    try {
      await cred.requireRefreshToken(mockRequest, {}, error => {
        throw error
      })
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /invalid signature/)
    }
  })

  test('require refresh token that has been revoked', async () => {
    const mockRequest = mockRequestFrom(testRefreshToken)

    await cred.revoke(testRefreshToken)

    try {
      await cred.requireRefreshToken(mockRequest, {}, error => {
        throw error
      })
      assert(false) // this shouldn't happen
    } catch (error) {
      assert.match(error.toString(), /Token has been revoked/)
    }
  })
})

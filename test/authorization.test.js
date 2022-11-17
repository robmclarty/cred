const assert = require('assert').strict
const credFrom = require('../src')

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

const mockRequestFrom = token => {
  return {
    headers: {
      authorization: `Bearer ${token}`
    }
  }
}

describe('Authorization', () => {
  const cred = credFrom(testConfig)
  let testAccessToken
  let testRefreshToken

  beforeAll(async () => {
    await cred.init()
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

    await cred.requireAccessToken(mockRequest, {}, error => {
      assert.match(error.toString(), /No token provided/)
    })
  })

  test('require access token with invalid signature', async () => {
    const token = await cred.createToken({
      ...testConfig.access,
      secret: 'invalid secret',
      subject: 'access',
      issuer: cred.issuer,
      payload: testPayload
    })
    const mockRequest = mockRequestFrom(token)

    await cred.requireAccessToken(mockRequest, {}, error => {
      assert.match(error.toString(), /invalid signature/)
    })
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

    await cred.requireRefreshToken(mockRequest, {}, error => {
      assert.match(error.toString(), /No token provided/)
    })
  })

  test('require refresh token with invalid signature', async () => {
    const token = await cred.createToken({
      ...testConfig.refresh,
      secret: 'invalid secret',
      subject: 'refresh',
      issuer: cred.issuer,
      payload: testPayload
    })
    const mockRequest = mockRequestFrom(token)

    await cred.requireRefreshToken(mockRequest, {}, error => {
      assert.match(error.toString(), /invalid signature/)
    })
  })

  test('require refresh token that has been revoked', async () => {
    const mockRequest = mockRequestFrom(testRefreshToken)

    await cred.revoke(testRefreshToken)

    await cred.requireRefreshToken(mockRequest, {}, error => {
      assert.match(error.toString(), /Token has been revoked/)
    })
  })

  test('require permission', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)

    await cred.requireAccessToken(mockRequest, {}, () => {})
    await cred.requirePermission('read:users')(mockRequest, {}, error => {
      assert(!error)
    })
  })

  test('require permission with uninitialized cred', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)

    await cred.requirePermission('read:users')(mockRequest, {}, error => {
      assert.match(error.toString(), /missing in request/)
    })
  })

  test('require permission with missing cred payload', async () => {
    const mockRequest = {
      ...mockRequestFrom(testAccessToken),
      [testConfig.key]: {}
    }

    await cred.requirePermission('read:users')(mockRequest, {}, error => {
      assert.match(error.toString(), /has no payload/)
    })
  })

  test('require permission with missing permissions in payload', async () => {
    const mockRequest = {
      ...mockRequestFrom(testAccessToken),
      [testConfig.key]: {
        payload: {
          userId: 123,
          anotherAttribute: 'something else'
        }
      }
    }

    await cred.requirePermission('read:users')(mockRequest, {}, error => {
      assert.match(error.toString(), /has no permissions/)
    })
  })

  test('require permission with invalid permissions', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)

    await cred.requireAccessToken(mockRequest, {}, () => {})
    await cred.requirePermission('non-matching-permission')(mockRequest, {}, error => {
      assert.match(error.toString(), /Insufficient permissions/)
    })
  })

  test('require custom payload prop', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)

    await cred.requireAccessToken(mockRequest, {}, () => {})
    await cred.requireProp('userId', testPayload.userId)(mockRequest, {}, error => {
      assert(!error)
    })
  })

  test('require invalid custom payload prop', async () => {
    const mockRequest = mockRequestFrom(testAccessToken)

    await cred.requireAccessToken(mockRequest, {}, () => {})
    await cred.requireProp('userId', 'invalid value')(mockRequest, {}, error => {
      assert.match(error.toString(), /Insufficient priviledges/)
    })
  })
})

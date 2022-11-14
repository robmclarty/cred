const assert = require('assert').strict
const initAuthentication = require('../src/authentication')

const testConfig = {
  key: 'test-cred',
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

const auth = initAuthentication(testConfig)

describe('Authentication', () => {
  test('init', () => {
    assert.equal(auth.key, testConfig.key)
    assert.equal(auth.issuer, testConfig.issuer)
  })

  test('uses strategy', () => {
    const strategies = auth.use('test-strat', () => 'test strat')

    assert(Object.keys(strategies).includes('test-strat'))
    assert.equal('test strat', strategies['test-strat']())
  })

  test('unuses strategy', () => {
    const strategies = auth.use('test-strat', () => 'test strat')
    assert(Object.keys(strategies).includes('test-strat'))

    const updatedStrategies = auth.unuse('test-strat')
    assert(!Object.keys(updatedStrategies).includes('test-strat'))
  })

  test.todo('create token')

  test.todo('create access token')

  test.todo('create refresh token')

  test.todo('verify')

  test.todo('verify active')

  test.todo('authenticate')

  test.todo('register')

  test.todo('refresh')
})

const assert = require('assert').strict
const makeAllowlist = require('../src/allowlist')

const delay = milliseconds => new Promise(resolve => {
  setTimeout(resolve, milliseconds)
})


describe('Allow List: Redis', () => {
  const redisList = makeAllowlist('redis', {
    redisUrl: 'redis://localhost:6379'
  })

  beforeAll(async () => {
    await redisList.init()
  })

  beforeEach(async () => {
    await redisList.reset()
  })

  afterAll(async () => {
    await redisList.close()
  })

  test('can add and list cache', async () => {
    const key = 'my-key'
    const value = '123'
    const ttl = 100

    await redisList.add(key, value, ttl)

    const list = await redisList.list()

    assert(list.includes(value))
  })

  test('can get an added value from cache', async () => {
    const key = 'my-key'
    const value = '123'

    await redisList.add(key, value)

    const fetchedValue = await redisList.get(key)

    assert.equal(fetchedValue, value)
  })

  test('can remove a value from cache', async () => {
    const key = 'my-key'
    const value = '123'

    await redisList.add(key, value)
    await redisList.remove(key)

    const fetchedValue = await redisList.get(key)

    assert(!fetchedValue)
  })

  test('expired value from cache', async () => {
    const key = 'my-key'
    const value = '123'
    const ttl = 1 // redis doesn't accept legative ttl values

    await redisList.add(key, value, ttl)
    await delay(2) // wait 2 milliseconds to ensure the key's ttl has expired

    const fetchedValue = await redisList.get(key)

    assert(!fetchedValue)
  })
})

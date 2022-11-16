const assert = require('assert').strict
const makeAllowlist = require('../src/allowlist')

describe('Allow List: Memory', () => {
  const memList = makeAllowlist('memory')

  beforeAll(async () => {
    await memList.init()
  })

  beforeEach(async () => {
    await memList.reset()
  })

  afterAll(async () => {
    await memList.close()
  })

  test('can add and list cache', async () => {
    const key = 'my-key'
    const value = '123'
    const ttl = 100

    await memList.add(key, value, ttl)

    const list = await memList.list()
    const cacheKey = memList.makeCacheKey(key)

    assert.equal(list[0][0], cacheKey)
    assert.equal(list[0][1].value, value)
    assert.equal(list[0][1].ttl, ttl)
  })

  test('can get an added value from cache', async () => {
    const key = 'my-key'
    const value = '123'

    await memList.add(key, value)

    const fetchedValue = await memList.get(key)

    assert.equal(fetchedValue, value)
  })

  test('can remove a value from cache', async () => {
    const key = 'my-key'
    const value = '123'

    await memList.add(key, value)
    await memList.remove(key)

    const fetchedValue = await memList.get(key)

    assert(!fetchedValue)
  })

  test('expired value from cache', async () => {
    const key = 'my-key'
    const value = '123'
    const ttl = -100

    await memList.add(key, value, ttl)

    const fetchedValue = await memList.get(key)

    assert(!fetchedValue)
  })
})

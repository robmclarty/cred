const assert = require('assert').strict
const makeAllowList = require('../src/allow_list')

describe('Allow List', () => {
  let lruList

  beforeAll(async () => {
    lruList = await makeAllowList('memory')
  })

  beforeEach(async () => {
    await lruList.reset()
  })

  afterAll(async () => {
    await lruList.close()
  })

  test('can add and list LRU cache', async () => {
    const key = 'my-key'
    const value = '123'
    const ttl = 100

    await lruList.add(key, value, ttl)

    const list = await lruList.list()

    assert.equal(list[0][0], key)
    assert.equal(list[0][1].value, value)
    assert.equal(list[0][1].ttl, ttl)
  })

  test('can get an added value from LRU cache', async () => {
    const key = 'my-key'
    const value = '123'

    await lruList.add(key, value)

    const fetchedValue = await lruList.get(key)

    assert.equal(fetchedValue, value)
  })

  test('can remove a value from LRU cache', async () => {
    const key = 'my-key'
    const value = '123'

    await lruList.add(key, value)
    await lruList.remove(key)

    const fetchedValue = await lruList.get(key)

    assert(!fetchedValue)
  })

  test('expired value from LRU cache', async () => {
    const key = 'my-key'
    const value = '123'
    const ttl = -100

    await lruList.add(key, value, ttl)

    const fetchedValue = await lruList.get(key)

    assert(!fetchedValue)
  })
})

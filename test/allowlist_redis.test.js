const assert = require('assert').strict
const makeAllowlist = require('../src/allowlist')

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

  test.only('can add and list cache', async () => {
    const key = 'my-key'
    const value = '123'
    const ttl = 100

    await redisList.add(key, value, ttl)

    const list = await redisList.list()

    console.log('list: ', list)

    // assert.equal(list[0][0], key)
    // assert.equal(list[0][1].value, value)
    // assert.equal(list[0][1].ttl, ttl)
  })

  // test('can get an added value from cache', async () => {
  //   const key = 'my-key'
  //   const value = '123'

  //   await redisList.add(key, value)

  //   const fetchedValue = await redisList.get(key)

  //   assert.equal(fetchedValue, value)
  // })

  // test('can remove a value from cache', async () => {
  //   const key = 'my-key'
  //   const value = '123'

  //   await redisList.add(key, value)
  //   await redisList.remove(key)

  //   const fetchedValue = await redisList.get(key)

  //   assert(!fetchedValue)
  // })

  // test('expired value from cache', async () => {
  //   const key = 'my-key'
  //   const value = '123'
  //   const ttl = -100

  //   await redisList.add(key, value, ttl)

  //   const fetchedValue = await redisList.get(key)

  //   assert(!fetchedValue)
  // })
})

const lru = require('lru-cache')
const redis = require('redis')

// Create a new Redis client and attach it to the Express request object.
const initRedis = async url => {
  const client = redis.createClient({ url })

  client.on('connect', () => console.log('Authentik connected to Redis'))
  client.on('error', err => console.log('Authentik Redis Error: ', err))

  await client.connect()

  return (req, res, next) => {
    req.authentik.cache.type = 'redis'
    req.authentik.cache.client = client
    next()
  }
}

// Create a new LRU client
const initLRU = async () => {
  return lru({
    max: 1000,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week (in milliseconds)
  })
}

const makeAllowList = async (type = 'memory', redisUrl) => {
  const cache = type === 'redis'
    ? await initRedis(redisUrl)
    : await initLRU()

  const get = async (key) => {
    switch (type) {
      case 'redis':
        return await cache.get(key)
      case 'memory':
      default:
        return cache.get(key)
    }
  }

  const add = async (key, id, maxAge) => {
    switch (type) {
      case 'redis':
        await cache.client.set(key, id)
        await cache.client.expire(key, maxAge)
        break
      case 'memory':
      default:
        cache.set(key, id, maxAge)
    }
  }

  const remove = async key => {
    switch (type) {
      case 'redis':
        return await cache.client.del(key)
      case 'memory':
      default:
        return cache.del(key)
    }
  }

  const close = async () => {
    switch (type) {
      case 'redis':
        return await cache.disconnect()
      case 'memory':
      default:
        return cache.clear()
    }
  }

  return {
    add,
    remove,
    get,
    close
  }
}

module.exports = makeAllowList

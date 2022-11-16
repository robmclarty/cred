const LRU = require('lru-cache')
const redis = require('redis')

// Create a new Redis client and attach it to the Express request object.
const initRedis = async url => {
  const client = redis.createClient({
    url,
    legacyMode: true
  })

  client.on('connect', () => console.log('Authentik connected to Redis'))
  client.on('error', err => console.log('Authentik Redis Error: ', err))

  await client.connect()

  return (req, res, next) => {
    req.cred.cache.type = 'redis'
    req.cred.cache.client = client
    next()
  }
}

// Create a new LRU client
const initLRU = async () => {
  return new LRU({
    max: 1000,
    ttl: 1000 * 60 * 60 * 24 * 7 // default ttl is 1 week (in milliseconds)
  })
}

const makeAllowlist = (type = 'memory', options = {}) => {
  const {
    redisUrl = ''
  } = options

  let cache

  const init = async () => {
    cache = type === 'redis'
      ? await initRedis(redisUrl)
      : await initLRU()
  }

  const list = async () => {
    switch (type) {
      case 'redis':
        // TODO
        return
      case 'memory':
      default:
        return cache.dump()
    }
  }

  const get = async key => {
    switch (type) {
      case 'redis':
        return await cache.get(key)
      case 'memory':
      default:
        return cache.get(key)
    }
  }

  const add = async (key, value, ttl) => {
    switch (type) {
      case 'redis':
        await cache.client.set(key, value)
        await cache.client.expire(key, ttl)
        break
      case 'memory':
      default:
        cache.set(key, value, { ttl })
    }
  }

  const remove = async key => {
    switch (type) {
      case 'redis':
        return await cache.client.del(key)
      case 'memory':
      default:
        return cache.delete(key)
    }
  }

  const reset = async () => {
    switch (type) {
      case 'redis':
        return await cache.disconnect() // TODO: make this `flush()` instead?
      case 'memory':
      default:
        return cache.clear()
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
    init,
    list,
    add,
    remove,
    get,
    reset,
    close
  }
}

module.exports = makeAllowlist

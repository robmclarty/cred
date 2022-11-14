const LRU = require('lru-cache')
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
  return new LRU({
    max: 1000,
    ttl: 1000 * 60 * 60 * 24 * 7 // default ttl is 1 week (in milliseconds)
  })
}

const makeAllowList = async (type = 'memory', options = {}) => {
  const {
    redisUrl = ''
  } = options

  const cache = type === 'redis'
    ? await initRedis(redisUrl)
    : await initLRU()

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

  const add = async (key, id, ttl) => {
    switch (type) {
      case 'redis':
        await cache.client.set(key, id)
        await cache.client.expire(key, ttl)
        break
      case 'memory':
      default:
        cache.set(key, id, ttl)
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
    list,
    add,
    remove,
    get,
    close
  }
}

module.exports = makeAllowList

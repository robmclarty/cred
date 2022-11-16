const LRU = require('lru-cache')
const redis = require('redis')

// Create a new Redis client and attach it to the Express request object.
// TODO: configure ssl connection? https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
const initRedis = async (name, url) => {
  const client = redis.createClient({
    name: 'allowlist',
    url
  })

  // TODO: perhaps pass in a custom logger function?
  client.on('error', err => console.error('client error', err));
  client.on('connect', () => console.log('client is connect'));
  client.on('reconnecting', () => console.log('client is reconnecting'));
  client.on('ready', () => console.log('client is ready'));

  // client.on('error', error => console.log('Cred Redis Error: ', error))
  // client.on('connect', () => console.log('Cred connected to Redis'))
  // client.on('ready', () => console.log('Cred Redis ready'))
  // client.on('reconnecting', () => console.log('Cred Redis reconnecting...'))
  // client.on('end', () => console.log('Cred quit from Redis'))

  await client.connect()

  return client
}

// Create a new LRU client
const initLRU = async () => {
  return new LRU({
    max: 1000,
    ttl: 1000 * 60 * 60 * 24 * 7 // default ttl is 1 week (in milliseconds)
  })
}

const makeCacheKey = (name, key) => `${name}:${key}`

const makeAllowlist = (type = 'memory', options = {}) => {
  const {
    name = 'allowlist',
    redisUrl = ''
  } = options

  let cache

  const init = async () => {
    cache = type === 'redis'
      ? await initRedis(name, redisUrl)
      : await initLRU()
  }

  const list = async () => {
    switch (type) {
      case 'redis':
        return cache.hGetAll(name)
      case 'memory':
      default:
        return cache.dump()
    }
  }

  const get = async key => {
    const cacheKey = makeCacheKey(name, key)

    switch (type) {
      case 'redis':
        return await cache.get(cacheKey)
      case 'memory':
      default:
        return cache.get(cacheKey)
    }
  }

  const add = async (key, value, ttl) => {
    const cacheKey = makeCacheKey(name, key)

    switch (type) {
      case 'redis':
        await cache.set(cacheKey, value)
        await cache.expire(cacheKey, ttl)
        break
      case 'memory':
      default:
        cache.set(cacheKey, value, { ttl })
    }
  }

  const remove = async key => {
    const cacheKey = makeCacheKey(name, key)

    switch (type) {
      case 'redis':
        return await cache.del(cacheKey)
      case 'memory':
      default:
        return cache.delete(cacheKey)
    }
  }

  const reset = async () => {
    switch (type) {
      case 'redis':
        return
        //return await cache.quit() // TODO: make this `flush()` instead?
      case 'memory':
      default:
        return cache.clear()
    }
  }

  const close = async () => {
    switch (type) {
      case 'redis':
        // client.flushall(function (err, reply) {
        //   client.hkeys('hash key', function (err, replies) {
        //     console.log("key set done")
        //     client.quit()
        //   })
        // })
        return await cache.quit()
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
    close,
    makeCacheKey: key => makeCacheKey(name, key)
  }
}

module.exports = makeAllowlist

'use strict';

const redis = require('redis');

// Create a new Redis client and attach it to the Express request object.
const setRedisClient = url => {
  const client = redis.createClient(url);

  client.on('connect', () => console.log('Authentik connected to Redis'));
  client.on('error', err => console.log('Authentik Redis Error: ', err));

  return (req, res, next) => {
    req.authentik.cache.type = 'redis';
    req.authentik.cache.client = client;
    next();
  };
};

module.exports = {
  setRedisClient
};

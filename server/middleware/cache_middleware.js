'use strict';

const redis = require('redis');

// Create a new Redis client and attach it to the Express request object.
const setRedisClient = url => {
  const client = redis.createClient(url);

  client.on('connect', () => console.log('Connected to Redis'));
  client.on('error', err => console.log('Redis Error: ', err));

  return (req, res, next) => {
    req.redis = client;
    next();
  };
};

Object.assign(exports, {
  setRedisClient
});

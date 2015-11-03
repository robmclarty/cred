'use strict';

let diskAdapter = require('sails-disk');
let mysqlAdapter = require('sails-mysql');
let mongoAdapter = require('sails-mongo');

module.exports = Object.freeze({
  token: {
    secret: process.env.SECRET || 'my_super_secret_secret',
    issuer: process.env.ISSUER || 'jwt-issuer',
    expiresInSeconds: process.env.EXPIRES_IN_SECONDS || 24 * 60 * 60 // expires in 24 hours by default
  },
  database: {
    adapters: {
      'default': diskAdapter,
      'disk': diskAdapter,
      'mysql': mysqlAdapter,
      'mongo': mongoAdapter
    },
    connections: {
      'local-disk': {
        adapter: 'disk'
      },
      'local-mongo': {
        adapter: 'mongo',
        url: process.env.DATABASE || 'mongodb://root@localhost:27017/jwt-api-db'
      },
      'local-mysql': {
        adapter: 'mysql',
        url: process.env.DATABASE || 'mysql://root@localhost:3306/jwt-api-db'
      }
    },
    defaults: {
      migrate: 'alter'
    }
  }
});

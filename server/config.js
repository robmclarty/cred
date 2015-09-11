'use strict';

module.exports = Object.freeze({
  'secret': process.env.JWT_SECRET || 'my_super_secret_secret',
  'database': process.env.DATABASE || 'mongodb://root@localhost:27017/jwt-api-db'
});

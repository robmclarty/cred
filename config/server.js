'use strict';

module.exports = {
  redis: process.env.REDIS || 'redis://localhost:6379',
  tokens: {
    issuer: process.env.ISSUER || 'authentik',
    access: {
      privateKeyPath: process.env.PRIVATE_KEY || './config/sample-private-key.pem',
      publicKeyPath: process.env.PUBLIC_KEY || './config/sample-public-key.pem',
      expiresIn: process.env.EXPIRES_IN || '24 hours',
      alg: 'ES384', // ECDSA using P-384 curve and SHA-384 hash algorithm
    },
    refresh: {
      secret: process.env.REFRESH_SECRET || 'my_super_secret_secret',
      expiresIn: process.env.EXPIRES_IN || '7 days',
      alg: 'HS512', // HMAC using SHA-512 hash algorithm
    }
  }
};

# Authentik

An express middleware which transforms your node server into a JSON Web Token
generator and authenticator.

It adds 3 resource endpoints to your express application: `/tokens`, `/users`,
and `/resources`. Each can be renamed through options (see below). These
resources are used to register new accounts, create and authenticate tokens, and
to assign permissions to external resources.

Basically, what you get out of the box is this:

1. Users can exchange credentials (username/password, social login, etc.) for
JSON Web Tokens.

2. Specific permissions can be assigned to each user for particular resources
which are reflected in the tokens they get when they authenticate.

3. Users can then use their tokens to request resources from other servers (or
this server) if their token permits them to do so. Resource servers implement
their own authorization using the token permissions (or can use our
authorization middleware [authentik-permissions](http://somewhere.com) if
implementing an express server).

## Install

`brew install gcc`

`sudo npm install -g node-gyp`

`CXX=g++-5 npm install argon2`

`npm install`


## Usage

```javascript
const fs = require('fs');
const express = require('express');
const app = express();
const authentik = require('authentik');
const authentikate = authentik(app);

authentikate({
  database: 'mongodb://localhost:27017/autehntik',
  tokens: {
    access: {
      privateKey: fs.readFileSync('private-key.pem'),
      publicKey: fs.readFileSync('public-key.pem'),
      expiresIn: '24 hours',
      algorithm: 'ES384',
    },
    refresh: {
      secret: 'my_other_secret',
      expiresIn: '7 days',
      algorithm: 'HS512'
    }
  }
});

app.listen(3000);
```

## Options

Many of these are optional but are available for customization. The bare
necessities are: 1) a database, 2) access token secret + alg, 3) refresh token
secret + alg. Each token can use *either* a secret string (e.g., using the  HMAC
algorithm) *or* a public/private key pair (e.g., using RSA or EC algorithm).

### `database`

This can be either an all-in-one string, or an object with separate properties.

"[protocol]://[username]:[password]@[host]:[port]"

- **`host`**
- **`protocol`**
- **`port`**
- **`username`**
- **`password`**

### `cache`

Currently only supports Redis.

"[protocol]://[username]:[password]@[host]:[port]"

- **`host`**
- **`protocol`**
- **`port`**
- **`username`**
- **`password`**

### `api`

- **`tokens`**
  - **`name`**
  - **`path`**
- **`users`**
  - **`name`**
  - **`path`**
- **`resources`**
  - **`name`**
  - **`path`**

### `tokens`

- **`issuer`**
- **`subject`**
- **`audience`**
- **`access`**
  - **`privateKey`**
  - **`publicKey`**
  - **`secret`**
  - **`expiresIn`**
  - **`algorithm`**
- **`refresh`**
  - **`privateKey`**
  - **`publicKey`**
  - **`secret`**
  - **`expiresIn`**
  - **`algorithm`**

## Todo

- implement model layer using something more flexible (e..g.,
  [orm2](https://github.com/dresende/node-orm2)) that works with alt DBs

- add additional cache systems besides just Redis and Memory.

- create alternate example implementations with more complex setups

- remove `isAdmin` from token and devise an alt means of setting an admin to
  reduce the load on the token itself

- create a method for attaching a dynamic "profile" object to a user (e.g., a
  separate profile model referenced by id, or some kind of serialized object
  directly inside the user model) so that any kind of custom data can be
  associated with Authentik's user model.

- add a new model `groups` to enable authorization control over a whole set of
  users rather than needing to change settings on each individual one

- create module for authorization middleware/helpers that can be used for any
  resource server (including this one). E.g., `token_middleware.js`,
  `token_helper.js`, and `authorization_middleware.js`.

- change cache to be a "whitelist" rather than a "blacklist" so that each and
  every token issued by the system can be tracked and controlled

- implement password reset flow

- implement alternative login flows (e.g., facebook, google, twitter, etc.)

- perhaps change resource "name" to "api key" as this seems a bit easier to
  understand how to use it, and also could be auto-generated by the system
  rather than user-defined... should be as short as possible, however, so as not
  to bloat the token.

- perhaps offer a way of installing without requiring a password (e.g., only use
  social media logins) in which case dependencies (like argon2) would not be
  required and simplify installation

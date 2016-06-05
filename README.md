# Authentik

An express middleware which transforms your node server into a JSON Web Token
generator and authenticator.

## Install

`brew install gcc`
`sudo npm install -g node-gyp`
`CXX=g++-5 npm install argon2`
`npm install`


## Usage

Adds 3 resource endpoints to your express application: `/tokens`, `/users`, and
`/resources`. Each can be renamed through options (see options below). These
resources are used to register new accounts, create and authenticate tokens, and
to assign permissions to external resources.

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

### `database`

- **`name`**
- **`port`**
- **`protocol`**
- **`username`**
- **`password`**
- **`url`**

### `cache`

- **`name`**
- **`port`**
- **`protocol`**
- **`username`**
- **`password`**
- **`url`**

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

# Cred API

Once you have [initialized](./initialization.md) Cred you will gain access to
a set of different functions you can call from it. All of these function can be
called from the main Cred object that was initialized (e.g., `cred.use()`).


Some functions
are focused on authentication (i.e., verifying that incoming credentials are
valid and generating new tokens from them), whereas other are focused on
authorization (i.e., given a token, determine if it is valid and grant access to
data/resources if the request is determined to be valid). Finally, the
initialization setting values are also included for convenient reference.

## Authentication

Use these functions to perform authentication-specific actions.

### `use`

Defines and stores an authentication strategy (a function) and returns an object
which will become each token's payload.

So, for example, you could define a set of logic that checks your database and
compares a username and password. If your logic passes, it will return a
user-defined object (up to you what that looks like) and this object will be
what is used for each tokens' body/payload.

You can name your strategy anything you like in the first parameter ;)

```javascript
cred.use('basic', req => {
  return User.findOne({ username: req.body.username })
    .then(user => user.verifyPassword(req.body.password))
    .then(isMatch => {      
      if (!isMatch) throw 'Unauthorized: username or password do not match.'

      return {
        name: 'My name',
        id: '12345',
        anotherAttribute: 'some-value'
      }
    })
})
```

Then on one of your routes, you could require valid login credentials by using
the `authenticate` function like this:

```javascript
const router = require('express').Router()

router.route('/login')
  .post(cred.authenticate('basic'), (req, res, next) => {})
```

### `unuse`

If, for some reason, you want to remove an already-defined authentication
strategy after your program has already started, you can use the `unuse`
function to remove it.

```javascript
cred.unuse('basic')
```

### `authenticate`

Given at least one pre-defined authentication strategy, the `authenticate`
function is used to create an Express middleware based on that strategy. It
will flow through the logic you defined when you made your strategy and if it
passes, it will attach a new `cred` object to the request which will include
newly created tokens which you can return in the response or do whatever you
want with them.

### `verifyActive`

Checks to see if the token's id exists in the cache (a whitelist) to determine
if the token can still be considered "active", or if it is "revoked".

### `verify`

Verify that the token is a valid JSON Web Token, that it is a refresh token, and
that it has not yet expired. Returns `true` or `false`.

### `getCache`

Returns the values stored in the cache.

### `revoke`

Remove a token's id from the cache essentially "deactivating" it from the
whitelist of valid tokens. If an id is not present in the cache it is considered
"revoked" or "invalid".

```javascript
cred.revoke(token)
  .then(revokedToken => res.json({
    message: 'Token revoked',
    token: revokedToken
  }))
```

### `register`

Sets a token's id in the cache essentially "activating" it in the whitelist of
valid tokens. If an id is not present in this cache it is considered "revoked"
or "invalid".

### `refresh`

Assuming the token (should be a refresh token) has already been authorized,
create new access and refresh tokens.

```javascript
cred.refresh(token)
  .then(freshTokens => res.json({
    message: 'Token refreshed.',
    tokens: freshTokens
  }))
```

### `createToken`

Create a new token with the provided payload and return the generated token.
See https://github.com/auth0/node-jsonwebtoken for errors generated
by jsonwebtoken npm package.

### `createAccessToken`

Specifically create a new access token.

### `createRefreshToken`

Specifically create a new refresh token.

## Authorization

Use these functions to perform authorization-specific actions.

### `requireAccessToken`

An express middleware that can be used to require the presence of a valid
access token in the request before proceeding. Will return a 401 unauthorized
response if the token is not valid, or not present.

```javascript
const router = require('express').Router()

router.route('/my/amazing/endpoint')
  .post(cred.requireAccessToken, (req, res, next) => {})
```

### `requirePermission`

An express middleware that can be used to require the presence of a specific
permission (or array of permissions) in the requesting token for this resource.
Will return a 401 unauthorized response if the token does not contain the
required permission, or no token is present.

```javascript
const router = require('express').Router()

router.route('/my/amazing/endpoint')
  .post(cred.requirePermission('read:stuff'), (req, res, next) => {})
  .delete(cred.requirePermission(['read:stuff', 'write:stuff']), (req, res, next) => {})
```

### `requireProp`

An express middleware that can be used to require the presence of a specific
property in the access token's body. For example, perhaps you want to include
a property called `isAdmin` in your tokens which can be true or false and you
want to create a route that only allows admins to access data on that endpoint.

```javascript
const router = require('express').Router()

router.route('/my/amazing/endpoint')
  .post(cred.requireProp('isAdmin', true), (req, res, next) => {})
```

### `tokenFromReq`

Anywhere in your middleware you can use `tokenFromReq` to grab the current token
from the request object that you pass it. This will return the raw JSON Web
Token  that was passed, and detected, by Cred in base64.

```javascript
const postStuff = (req, res, next) => {
  const token = tokenFromReq(req)
}
```

### `createError`

This is a simple utility function used internally that could be used externally
too if you like it. It simply creates a new `Error` object and assigns it a
message and attaches a `status` to it.

```javascript
const myError = createError(401, 'you are not authorized to access this resource')
```

## Settings

Read the values used during initialization through these properties.

### `key`

The name used to refer to the cred object. An attribute with this name will be
automatically attached to each Express request object for use in other
middleware.

### `issuer`

The name of the issuer that made the tokens.

### `resource`

The name of the resource server authorizing the tokens (there can be more than
one in total, but this value is the name of *this* current resource server).

### `cache`

The type of cache being used (e.g., `memory` or `redis`). Currently only memory
cache is supported.

### `accessOpts`

Options used to create access tokens (see [initialization](./initialization.md)
for more details).

### `refreshOpts`

Options used to create refresh tokens (see [initialization](./initialization.md)
for more details).

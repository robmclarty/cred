# Cred Initialization

Cred is flexible and can be implemented in many different ways. The simplest way
is to simply plug it into your app and generate tokens and use them on the same
server. However, if you so choose, you can also separate these functions onto
their own separate server such that you can "login" and generate access tokens
on one server and then take those tokens over to another resource server and use
them to gain access to its data. That resource server could be an http API, a
websocket server, or anything else that can digest JSON Web Tokens.

At the top level of the API there is a choice to load "authorize only" or the
full API. This allows you to save some of your server resources if your server
will only ever be authorizing access to its data, as opposed to running the full
authentication and token generation functions required for a full auth server.

## Initialization Settings

When you initialize cred, at its most basic level, you will need to define two
parameters: 1) initialization settings, and 2) authorizeOnly (defaults to `false`).
By default authorizeOnly is false (meaning the full library will be loaded) and
you will have access to all the API's functions. If this is explicitly set to
`true` however, you will only have available the functions listed under
"Authorize Only" below.

Example, high-level, initialization modules which exports the cred object for
use in other modules:

Usually what I like to do is initialize cred in a separate file/module and
export it for (re)use in other modules that need it. In this init file I'll
setup all my token configurations and define all my authentication strategies.
Then, in some other module, I can import cred from this and it will already be
setup and ready to use (because Nodejs maintains a single, common reference to
each module that is defined).

```javascript
const { readFileSync } = require('fs')
const gotCred = require('cred')

const options = {
  resource: 'my-app-name',
  issuer: 'my-issuer-name',
  accessOpts: {
    privateKey: readFileSync('/my/access/private/key/path'),
    publicKey: readFileSync('/my/access/public/key/path'),
    expiresIn: '24 hours',
    algorithm: 'ES384'
  },
  refreshOpts: {
    secret: 'my_super_secret_secret',
    expiresIn: '7 days',
    algorithm: 'HS512'
  }
}

const authorizeOnly = false

const cred = gotCred(options, authorizeOnly)

cred.use('basic', req => {
  // define basic strat
})

cred.use('facebook', req => {
  // define facebook strat
})

module.exports = cred
```

Many of the initialization settings come with defaults and are optional, however
it is recommended that you define your own values explicitly so that it is
obvious how your app works to other developers ;) If you are loading in
authorize-only-mode you do not need to define `refreshOpts` as they will simply
be ignored in this mode.

### `key`

This is an arbitrary string which you can use to override the default name that
is given to the object attached to your Express request object when someone logs
into your system. By default it is called `cred` which may be the easiest name
to remember as it already refers to its origin. However, you have the ability
to name it anything you want by simply defining this property and giving it a
different value.

### `resource`

A "resource" in this context is the name of the app/server which will be doing
the authorization. That is, whenever a user requests data from a server you are
protecting with Cred, the name of *that* server is the value you would use for
this property. When you give a user a set of permissions for accessing a
resource, it is this property's value which will be matched against the
permissions in the user's token (see [permissions](./permissions.md) for more
details on how permissions work with Cred).

### `issuer`

The name of the token issuer. Each JWT has a property called "issuer"
which is used to identify where the token came from. Any server which wishes to
authorize tokens needs to match the token's issuer with this value. This is a
front-line defense against tokens generated from 3rd party/rogue servers which
will automatically dismiss any token not created from the expected issuer.

### `cache`

(in progress)

The type of cache to be used for whitelisting active refresh tokens. Any token
not in this list will be considered invalid.

Currently only "memory" is available for cacheing (and is the default) but plans
are in place to add other options like "redis".

### `accessOpts`

All settings needed for defining "access tokens". Access tokens are short lived
tokens used for accessing data from other resource servers (or from the issuing
server).

Not all of these  options are required, but the algorithm you select will
determine which  attributes you need:

1) HMAC + SHA requires `secret` to be defined as a random secret string, public
and private keys are not required in this case.

2) RSA and Elliptic Curve algorithms require a private and public key to be
defined, a secret string is not required in this case.

#### `secret`

A secret string used to sign tokens as a hash of their contents to prevent
manipulation of the data and verification of its authenticity. This string
should correspond to the algorithm you choose. You  should use a string that is
big enough to be secure (e.g., greater than 128  bits) and should ideally be
generated using a cryptographically secure pseudo random number generator
(CSPRNG). In the case of cred, the secret is being stored as a string, so 128
bits can be represented by generating a random 32 character length hex string,
or alternatively you could generate 16 random bytes and then run them through a
base64 function.

A good place to start your random number generated journey is at Gibson Research
Corporation's [Perfect Passwords](https://www.grc.com/passwords.htm) site. Just
reload the page to get a new random string ;)

#### `privateKey`

If you're not using the HMAC algorithm (i.e., you want to use RSA or EC) then
you're going to need a private and public key. These can be generated with an
outside program (e.g., [openssl](https://www.openssl.org/)). The value of this
property is the value of the key itself, so if you store it in a separate file
(which you should, so you can put additional permissions on top of it) you
should read the file and put its value into this property when you intitialize
Cred.

#### `publicKey`

Similar to the private key, the public key corresponds to it the same way.

#### `expiresIn`

How long the token will live for, expressed in seconds or a string describing a
timespan (e.g., 60, "2 days", "10h", "7d"). These values are based on the
[ms](https://github.com/zeit/ms) package.

#### `algorithm`

The following algorithms are currently supported.

- `HS256`: HMAC using SHA-256 hash algorithm
- `HS384`: HMAC using SHA-384 hash algorithm
- `HS512`: HMAC using SHA-512 hash algorithm
- `RS256`: RSASSA using SHA-256 hash algorithm
- `RS384`: RSASSA using SHA-384 hash algorithm
- `RS512`: RSASSA using SHA-512 hash algorithm
- `ES256`: ECDSA using P-256 curve and SHA-256 hash algorithm
- `ES384`: ECDSA using P-384 curve and SHA-384 hash algorithm
- `ES512`: ECDSA using P-521 curve and SHA-512 hash algorithm
- `none`: no digital signature or MAC value included

These values are based on the [jws](https://github.com/brianloveswords/node-jws)
package.

### `refreshOpts`

If this is for an authentication server (i.e., a server that will be generating
new tokens based on login credentials) you can define separate parameters for
the refresh tokens that get generated here. They are exactly the same as those
used for the accessOpts above but separate so each token has its own security.

Refresh tokens are longer lived tokens which are used, simply, or requesting
new access tokens when your old access tokens have expired. All refresh tokens
are logged in a whitelist on the issuing server which keeps track of currently
active refresh tokens. An admin could potentially revoke a refresh token from
this list, reset all tokens, or individual token owners can revoke their own
token (i.e., log out).

#### `secret`

Secret string used for HMAC algorithms (same as accessOpts).

#### `privateKey`

Private key string used for RSA and EC algorithms (same as accessOpts).

#### `publicKey`

Public key string used for RSA and EC algorithms (same as accessOpts).

#### `expiresIn`

Time until token expires (same as accessOpts).

#### `algorithm`

The algorithm used to sign the token (same as accessOpts)

## Authorize Only

The second parameter of the Cred initialization function is a boolean value
called `authorizeOnly` which tells Cred which mode to start in. By default, this
value is set to `false` which loads the full package and is used for
token-generating servers which will be accepting login credentials and outputting
JWTs.

If, however, you are creating a separate server which will work alongside an
already existing authentication server and all you need is to be able to read
incoming tokens with each request and determine if they are valid or not, then
you can set this value to `true` and only load the parts of the package you
need (i.e., without all the refresh token stuff). This is a minor optimization
but one that loads less stuff in your RAM if that's a concern.

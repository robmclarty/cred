# Got Cred?

Cred is a flexible authentication and authorization middleware for
[Express](https://expressjs.com/) apps
which uses JSON Web Tokens. It is meant to be unobtrusive and let you decide
where data is stored, how cred(entials) are determined to be valid, and what the
structure of the JWT's payload looks like.

Using the built-in Express middleware `cred.authenticate('my-strat')` you can
authenticate an endpoint by providing parameters from the
request's body, validate them, and then return an object literal which will
become the payload of the JWTs returned by the module.

## Install

`npm install cred`

## Usage

The two most important things you need to do to use this are *configure* + *initialize* the module, and then provide it with at least one authentication "strategy" (a function you define which determines if someone provided the right credentials) which should simply return an object containing the payload you want to include in all tokens created using that strategy.

### Configuration

If you wanted to implement a simple username + password strat,
you could initialize the module like this (this is assuming you have, in this
case, some sort of "model" module called 'User' for fetching user state from
a store + that model's property `password` is the result of a hash produced by
the library `bcrypt`... these aren't necessary, but are sufficient for this
real-world example):

`cred.js`

```javascript
const credFrom = require('cred')
const bcrypt = require('bcrypt')

const UserModel = require('./models/User')

const cred = credFrom({
  issuer: 'my-issuer-name',
  accessOpts: {
    secret: 'my-super-secret-secret',
    expiresIn: '1 hour'
  },
  refreshOpts: {
    secret: 'my-other-super-secret-secret',
    expiresIn: '1 week'
  }
})

cred.use('basic', async req => {
  const user = await UserModel.findOne({ username: req.body.username })
  const isMatch = await bcrypt.compare(req.body.password, user.password)
         
  if (!isMatch) {
    // (assuming there are Express error handler middlewares setup to catch)
    throw new Error('Unauthorized: username or password do not match')
  }

  const jwtPayload = {
    name: 'My name',
    id: '12345',
    anotherAttribute: 'some-value'
  }

  return jwtPayload
})

module.exports = cred
```

The way credentials are verified is totally up to you. You can `throw`, if the credentials
don't match, and return an object for the token payload if they do. That's all
this "strategy" function needs to do.

You can `throw` an error message in this function as it is part of another
`Promise` chain inside Cred which will handle outputting an error message with a
`401` error code as part of an Express middleware. As a result, you also don't
need to `catch` those errors right here ;) But you could override Cred's
behaviour in your own catch if you prefer, and respond to the error in your own
way.

What I usually like to do is put all this configuration code in a separate file
called `cred.js` alongside my Express app's `app.js` and export the configured
`cred` instance. Modules act as closures and can thus be used like singletons,
so any subsequent imports of the module will reference the same configured
instance.

### Initialization

The main Express app also needs to initialize Cred's allow-list store (e.g.,
uses a simple memory store by default, or can be set to use Redis instead).

*NOTE*: This is an asynchronous operation, so you'll need to take that into
account with how you setup your app.

I usually like separating my "app" from my "server" so that I can more easily
isolate the app for testing purposes, separate from actually launching the server.

#### Server

`server.js`

```javascript
const createApp = require('./app')

createApp().then(app => {
  app.listen(3000)
})
```

#### App

You can use the `cred.authenticate(stratName)` as a middleware in your
routes to require the above credentials before proceeding to the next middleware
in your chain like this (just remember to use the same name you defined in the
above function; here we called it 'basic'):

`app.js`

```javascript
const express = require('express')
const cred = require('./cred') // assuming this is a file like the example above

const createApp = async () => {
  const app = express()

  // call cred's initialize function here
  await cred.init()

  app.post('/login', cred.authenticate('basic'), (req, res, next) => {
    const { tokens } = req.cred

    res.json({
      message: 'Login successful',
      tokens
    })
  })

  app.get('/authenticated', cred.requireAccessToken, (req, res, next) => {
    res.json({
      message: 'Your access token is authenticated'
    })
  })

  return app
}

module.exports = createApp
```

What happens when you use the above middleware is that Cred will add an
attribute to the Express request object called "cred" (you can override this
with a different name if you like by passing the configuration function a value
for `key`) which will contain two new JSON Web Tokens using the payload you defined in your strat.

These tokens can then be used to gain authorization to other parts of your app
which can be set up to only accept valid JWTs. These tokens can also be stored
in your front-end apps to be re-used each time they need to make a request to
your server. This is a lot  simpler than using something like Oauth, or managing
a session store and opening yourself up to the problems associated with cookies
(for example). To read more about JWTs, check out the `/docs` folder, especially
[What is a JSON Web Token?](./docs/jwt.md).

The two tokens that get generated are 1) an "access" token, and 2) a "refresh"
token. The difference is, an "access" token is used for regularly "doing stuff"
with your api (getting access to resources), whereas the "refresh" token is used
to simply "get a new access token". The reason for the two is that the access
token is very short lived (up to you, the default is 1 hour) whereas the refresh
token is longer lived (again, up to you, but the default is 1 week). This
ensures that any access token that is issued will "die on its own" and become
invalid without doing anything else. But users have 1 week to "refresh" their
token with a new one. When this is done, the refresh token is checked against an
internal allow-list store which tracks all currently active (and valid) refresh
tokens. This way you have control over all refresh tokens issued and can revoke
them as needed to prevent someone from getting new access tokens. When a user
logs out, you simply need to revoke their refresh token (their access token will
expire on its own). If the user's refresh token was revoked, or if it
expired on its own, the user will be required to provide authentic credentials
once again through the login process in order to get new tokens.


### Revoke ("logout")

You can revoke and refresh a token like this:

```javascript
router.route('/logout').delete(cred.requireRefreshToken, async (req, res, next) => {
  try {
    const revokedToken = await cred.revoke(req.cred.token)

    res.json({
      message: 'Logged out.',
      token: revokedToken
    })
  } catch (error) {
    next(error)
  }
});
```

### Refresh

```javascript
router.route('/refresh').post(cred.requireRefreshToken, async (req, res, next) => {
  const { token } = cred.getCredFrom(req)

  try {
    const freshTokens = await cred.refresh(token)

    res.json({
      message: 'Tokens refreshed.',
      tokens: freshTokens
    })
  } catch (error) {
    next(error)
  }
});
```

When using either `cred.requireRefreshToken` or `cred.requireAccessToken` as
middleware, these will attach a single `token` attribute to the `cred` attribute
on the request object being either the refresh token or access token
respectively. This is different from the `cred.authenticate()` method which
attaches *both* tokens as a `tokens` attribute.

`cred.refresh` returns an object containing two attributes: 1) `accessToken` and
2) `refreshToken`. You can return those to the user/front-end for use to
continue accessing resources.

`cred.revoke` removes the refresh token that was used in
`cred.requireRefreshToken` and returns the revoked token. You can return that if
you want, or do nothing.

Last, you can setup any of your authorized routes to require a valid access
token like this:

```javascript
router.route('/resources')
  .all(cred.requireAccessToken)
  .post(postStuff)
  .put(putStuff)
  .delete(deleteStuff)
  .get(getStuff);
```

Full API docs can be found in `/docs` in [API Docs](./docs/api.md).

For more advanced usage with specific "roles" or "permissions", check out the
[Using Permissions](./docs/permissions.md) doc.

## License

MIT

## Acknowledgements

I'm using the [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) library
created by [Auth0](https://auth0.com/) which is based on
[jws](https://github.com/brianloveswords/node-jws) and
[jwa](https://github.com/brianloveswords/node-jwa) for handling the JSON web
token verification and generation.

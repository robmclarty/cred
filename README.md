# Simple JWT API

A base-line JWT-authenticated API server.

This is meant to be a starting point/reference for how one might go about
architecting an API server using JWTs as the mechanism/transport for
authenticated requests.

A placeholder "resource" model is included to demonstrate how you might want
to include some data for your API to serve, and a "user" model is setup
to handle the basics of account management. The idea is that you would take this
and extend, modify, and change this base-line and build-up a specialized app
that handles your particular needs.


## Why?

Because after years of smashing cookies into oauths, JWT is a breath of fresh
air that has all the security features you'd want, with a lot less headache.
Plus you can do stuff with JWT you can't do with other systems.

I wrote [this article](JWT.md) about how JWT works compared to cookie-based
sessions if you want to read more ;)


### Code Over Configuration

Personally, I don't like too much magic in my apps, and prefer code over
configuration. I'd rather *see* what's going on than having to blast through
mountains of docs (or the opposite: *lacking* needed docs), trying to find
out how to invoke some magical black-box function to do what I want. I've used
some standard libraries (like [express](http://expressjs.com/), and
[node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)), but otherwise
have tried to put all the business logic into organized modules where you can
change, manipulate, and mould the code directly, to suit your own needs.

If you prefer using config files to abstract away all the code and have your api
magically construct itself without getting your hands too dirty (at the expense
of customization and understanding), this isn't for you. You should look into
something like [loopback](http://loopback.io/) or [sails](http://sailsjs.org/).
These are very good options for their use-cases and I encourage you to explore
them. I just, personally, find it more difficult to bend such frameworks to my
will and prefer to fully understand (and control) what my app is doing; to be
able to dig in and change stuff when I don't like how it's working ;)


### Database ORM

I started out using [mongoose](http://mongoosejs.com/), but later decided to
switch to [waterline](https://github.com/balderdashy/waterline) in order to
support more database options, making this a bit more flexible for anyone that
wants to use it. I think mongoose is really great and I usually choose it for
my personal projects, but I understand that NoSQL isn't for everyone, and that
a small ORM abstraction can help fit this kind of API into more people's
use-cases. I chose waterline over other libraries (such as
[sequalize](http://sequelizejs.com), [bookshelf](http://bookshelfjs.org/), and
[orm2](https://github.com/dresende/node-orm2)) for its similarities (in syntax)
to mongoose, which I think expresses data connections more simply than these
other libraries. That said, all the code is right there, so feel free to swap
it out for something else as you see fit!


## Installation

Install the dependencies, create a default user, and start'er up!

```shell
  npm install

  gulp createUser -u admin -p password -a true

  npm start
```


## Usage

```shell
  npm start
```

I've added `--harmony_destructuring` to the invokation of node in
`npm start` so that I can use ES6 destructuring syntax while we wait for V8
to implement it natively as this saves a lot of repetition ;)

Before you can use the API, you need a valid user account registered with the
app first. I've created a simple gulp task for creating a new user from the
command line to get you started.

```shell
gulp createUser -u [username] -p [password] -a [true/false]
```

The last parameter `-a` tells the createUser function whether or not to make
that user an "admin". I recommend you make your first user an admin so you can
use that account to setup anything else you want to do directly through API
calls, with admin priviledges.

There's also another helper gulp task `gulp listUsers` which you can use to quickly
check what users you already have saved into your database. It just prints out
a list of usernames on the command line.


### Authenticate

Here, I'm logging in with a user called "admin" using a password "password". This
user already exsists in the database with those credentials.

#### request

POST `/authenticate`

```shell
curl -X POST -H "Content-Type: application/json" -d '{"username":"admin", "password":"password"}' http://localhost:3000/token
```

#### response

```json
{
  "success": true,
  "message": "Enjoy your token!",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc"
}
```


### List Users

Once authenticated and in the possession of a token, you can make requests
against the server, supplying the token in one of four different ways:

#### request

GET `/api/users`

```shell
# 1. authorization header (bearer token)
curl -X GET -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/users

# 2. x-access-token header
curl -X GET -H "x-access-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/users

# 3. query parameter
curl -X GET http://localhost:3000/api/users?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc

# 4. post body (this doesn't work with the server in this repo; this is just for reference)
curl -X POST -d "token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/users
```

#### response

```json
[
  {
    "_id": "55e73b7bf7bf4ea569fc3437",
    "username": "admin",
    "password": "[encrypted]",
    "admin": true,
    "__v": 0
  }
]
```


### Create a New User

Creating users requires both a valid token + a user that is an admin (their
token has `isAdmin` set to true). New users default to `isAdmin` being `false`.

#### request

POST `/api/users`

```shell
curl -X POST -H "Content-Type: application/json" -d '{"username":"rob", "password":"password"}' -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/users
```

#### response

```json
{
  "success": true,
  "message": "New user added."
}
```


### Add a New Resource

#### request

POST `/api/resources`

```shell
curl -X POST -H "Content-Type: application/json" -d '{"name":"My New Resource", "description":"A description that describes stuff.", "notes":"These are some notes."}' -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/resources
```

#### response

```json
{
  "success": true,
  "message": "Resource created.",
  "resource": {
    "__v": 0,
    "name": "My New Resource",
    "description": "A description that describes stuff.",
    "notes": "These are some  notes.",
    "_id": "55ec68abb2efe3aa0ce55649"
  }
}
```


### List All Resources

GET `/api/resources`

#### request

```shell
curl -X GET -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/resources
```

#### response

```json
{
  "success": true,
  "message": "Resources found.",
  "resources": [
    {
      "_id": "55ec67f5e36c8b460c077af9",
      "name": "My New Resource",
      "description": "A description that describes stuff.",
      "notes": "These are some notes.",
      "__v": 0
    },
    {
      "_id": "55ec686ee36c8b460c077afa",
      "name": "Another Resource",
      "description": "Another description that describes stuff.",
      "notes": "These are some more notes.",
      "__v": 0
    },
    {
      "_id": "55ec68abb2efe3aa0ce55649",
      "name": "Yet Another Resource",
      "description": "Yet another description that describes stuff.",
      "notes": "These are some more notes.",
      "__v": 0
    }
  ]
}
```


### Get a Single Resource

GET `/api/resources/:id`

#### request

```shell
curl -X GET -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/resources/
```

#### response

```json
{
  "success": true,
  "message": "Resource found.",
  "resource": {
    "_id": "55ec67f5e36c8b460c077af9",
    "name": "My New Resource",
    "description": "A description that describes stuff.",
    "notes": "These are some notes.",
    "__v": 0
  }
}
```


### Update a Resource

PUT `/api/resources/:id`

#### request

```shell
curl -X PUT -d '{"name":"My New Resource Name"}' -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/resources/
```

#### response

```json
{
  "success": true,
  "message": "Resource updated.",
  "resource": {
    "_id": "55ec67f5e36c8b460c077af9",
    "name": "My New Resource Name",
    "description": "A description that describes stuff.",
    "notes": "These are some notes.",
    "__v": 0
  }
}
```


### Delete a Resource

DELETE `/api/resources/:id`

#### request

```shell
curl -X DELETE -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/resources/
```

#### response

```json
{
  "success": true,
  "message": "Resource deleted.",
  "resource": {
    "_id": "55ec67f5e36c8b460c077af9",
    "name": "My New Resource Name",
    "description": "A description that describes stuff.",
    "notes": "These are some notes.",
    "__v": 0
  }
}
```

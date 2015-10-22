# Simple JWT API

A simple JWT-authenticated API server.


## Installation

Install the dependencies, create a default user, and start'er up!

```shell
  npm install

  gulp createUser -u admin -p password -a true

  npm start
```


## Why?

Because after years of smashing cookies into oauths, JWT is a breath of fresh
air that has all the security features you'd want, with a lot less headache.
Plus you can do stuff with JWT you can't do with other systems.

I wrote [this article](JWT.md) about how JWT works compared to cookie-based
sessions if you want to read more ;)


## Usage

```shell
  npm start
```

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

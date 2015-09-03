# Simple JWT API

A simple JWT-authenticated API server.

## Usage

`> node server/app`

### Authenticate

Here, I'm logging in with a user called "admin" using a password "password". This
user already exsists in the database with those credentials.

#### request

```
curl -X POST -H "Content-Type: application/json" -d '{"username":"admin", "password":"password"}' http://localhost:3000/authenticate
```

#### response

```
{
  "success": true,
  "message": "Enjoy your token!",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc"
}
```

### List Users

#### request

```
curl -X GET -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/users

curl -X GET -H "x-access-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/users

curl -X GET http://localhost:3000/api/users?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc
```

#### response

```
[
  {
    "_id": "55e73b7bf7bf4ea569fc3437",
    "username": "admin",
    "password": "[encrypted]",
    "admin": true,
    "__v": 0
  },
  ...
]
```

### Create a New User

Creating users requires both a valid token + a user that is an admin (their
token has `isAdmin` set to true). New users default to `isAdmin` being `false`.

#### request

```
curl -X POST -H "Content-Type: application/json" -d '{"username":"rob", "password":"password"}' -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU1ZTc1MzRhNGI0NGZkZmExM2Y4ZDJhNCIsInVzZXJuYW1lIjoiYWRtaW4iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE0NDEzMDg1NTgsImV4cCI6MTQ0MTM5NDk1OH0.5BV4kzoBbfcpYIdoyV21WMxL6PNYjmFcv6VSUsJL6Sc" http://localhost:3000/api/users
```

#### response

```
{
  "success": true,
  "message": "New user added."
}
```

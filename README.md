# Simple JWT API

A simple JWT-authenticated API server.

## Usage

`> node server/app`

### Authenticate

#### request

```
curl -X POST -H "Content-Type: application/json" -d '{"username":"admin", "password":"password"}' http://localhost:3000/api/authenticate
```

#### response

```
{
  "success": true,
  "message": "Enjoy your token!",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NWU3M2I3YmY3YmY0ZWE1NjlmYzM0MzciLCJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJwYXNzd29yZCIsImFkbWluIjp0cnVlLCJfX3YiOjB9.7NnGu1beCvhaNSemZ10Ppf89m3CEQIAmyqWzSUHjfLc"
}
```

### List Users

#### request

```
curl -X GET -H "x-access-token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NWU3M2I3YmY3YmY0ZWE1NjlmYzM0MzciLCJ1c2VybmFtZSI6ImFkbWluIiwicGFzc3dvcmQiOiJwYXNzd29yZCIsImFkbWluIjp0cnVlLCJfX3YiOjB9.7NnGu1beCvhaNSemZ10Ppf89m3CEQIAmyqWzSUHjfLc" http://localhost:3000/api/users
```

#### response

```
[
  {
    "_id": "55e73b7bf7bf4ea569fc3437",
    "username": "admin",
    "password": "password",
    "admin": true,
    "__v": 0
  },
  ...
]
```

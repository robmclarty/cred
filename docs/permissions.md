# Using Permissions

Users must create a valid JWT in order to access resources on your server(s).
But the token alone doesn't enable the user to do everything per se. If your
resources require specific permissions then users must also have *permission* to
do things on the server receiving the request.

A "permission" in this context means, simply, that the user has the following:

1. a valid JSON Web Token
2. an attribute called `permissions` in the token's payload inside which is an
attribute that is the "app-name" for the resource server receiving the user's
request
3. a "permissible action" inside the array of `actions` for the resource server
which allows the user to perform the action s/he is requesting from the server

What does this look like? Well, here's an example JWT with some example values
to demonstrate what I'm talking about:

```json
{
  "userId": "89908iuh2bjb2",
  "name": "my name",
  "permissions": {
    "my-app-name": {
      "actions": ["action1", "action2"]
    }
  }
}
```

In this example, the user *has permission* to perform "action1" or "action2"
when making requests to the resource server that is called "my-app-name".

A more real-world example:

```json
{
  "userId": "89908iuh2bjb2",
  "name": "Rob McLarty",
  "permissions": {
    "rob-chat": {
      "actions": ["user", "admin"]
    }
  }
}
```

In this example, the user making the request with this token has both the
"user" and "admin" actions assigned to his permissions for the app called
"rob-chat". This allows him to do everything a regular user is allowed to do
such as reading user data, while also doing admin actions like changing data as
an admin.

But this system can be pushed further to allow much more fine-grained control
over what users can and cannot do (if desired).

A more sophisticated example:

```json
{
  "userId": "89908iuh2bjb2",
  "name": "Rob McLarty",
  "permissions": {
    "rob-chat": {
      "actions": [
        "profiles:write",
        "profiles:read",
        "messages:send",
        "files:upload",
        "files:download"
      ]
    }
  }
}
```

In this example, permissible actions have been split up into much more detailed
and specific labels. Now, rather than simply having the "user" permission,
this user can specifically read and write profile data, send messages, and upload
and download files. This extra detail can be used to control permissions
differently. So, for example, a user could be assigned permission to read
profiles, but not write them, while also being able to download files,
but perhaps not have the ability to upload them (and change the data).
The possibilities are up to you. The system if very flexible.

**NOTE**: The only caveat is that the resource server must enforce the actions
that you define. Any list of actions can be associated with an app,  but it is
up to the resource server to do something about it.

For example, you might want to use `cred.requirePermission()` as an Express
middleware to require the presence of a certain permissible action on an
endpoint in your app (see the [Cred API](./api.md) for more details). But this
isn't the only way you could use these values. You could write your own custom
logic for determining if a user's token has authorized permissions your app
requires. It doesn't necessarily have to be an Express app. It doesn't have to
even be Javascript!

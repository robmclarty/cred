# Got Cred?

Cred is a simpler authentication and authorization middleware for express apps
which uses JSON Web Tokens. It is meant to be unobtrusive and let you decide
where data is stored, how cred(entials) are determined to be valid, and what the
structure of the JWT's payload looks like.

All you need to do is give cred a function which takes parameters from the
request's body, validates them, and then returns an object literal which will
become the payload of the JWTs returned by the system.

## Install

`npm install cred`

## Usage

TODO...

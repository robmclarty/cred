curl \
  -X GET
  http://localhost:3000

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin", "password":"password"}' \
  http://localhost:3000/login

curl \
  -X GET \
  -H "Authorization: Bearer eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWQiOiIxMjM0NTYiLCJpc0FjdGl2ZSI6dHJ1ZSwicGVybWlzc2lvbnMiOnsibXktYXBwLW5hbWUiOnsiYWN0aW9ucyI6WyJhY3Rpb24xIiwiYWN0aW9uMiIsImFjdGlvbk4iXX19LCJpYXQiOjE0NjYxOTY0OTcsImV4cCI6MTQ2NjI4Mjg5NywiaXNzIjoibXktaXNzdWVyLW5hbWUiLCJqdGkiOiJCSllNTWtHciJ9.Z5kIREUh5AC2lgCYyGG7TQDYXneN2AcGUHDeHqIXWUR5ueGVNlSR5MWsGfxP0qSFi660fe8yH2IyGOeFwifSOKYh9g2uG1WWL2rjGGE5naO9cznhNckoC3-QcDjTywMf" \
  http://localhost:3000/custom

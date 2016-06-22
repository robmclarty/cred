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
  -H "Authorization: Bearer eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWQiOiIxMjM0NTYiLCJpc0FjdGl2ZSI6dHJ1ZSwicGVybWlzc2lvbnMiOnsibXktYXBwLW5hbWUiOnsiYWN0aW9ucyI6WyJhY3Rpb24xIiwiYWN0aW9uMiIsImFjdGlvbk4iXX19LCJpYXQiOjE0NjY1NDE2NTMsImV4cCI6MTQ2NjYyODA1MywiaXNzIjoibXktaXNzdWVyLW5hbWUiLCJqdGkiOiJIeWFJVW12ciJ9.dVdyV4eqwzV9kH2W8u0DqUUZrp6DehrQlNuT4ERwPeWpyK-LXApkUOSY4FvkMr-0iTUMCRIVEuSKgI2IAGoaMbchh0xtOq07HimgDb-Q4HQsWGablamNDqk9F8JCFF66" \
  http://localhost:3000/custom

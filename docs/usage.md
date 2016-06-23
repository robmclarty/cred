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
  -H "Authorization: Bearer eyJhbGciOiJFUzM4NCIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWQiOiIxMjM0NTYiLCJpc0FjdGl2ZSI6dHJ1ZSwicGVybWlzc2lvbnMiOnsibXktYXBwLW5hbWUiOnsiYWN0aW9ucyI6WyJhY3Rpb24xIiwiYWN0aW9uMiIsImFjdGlvbk4iXX19LCJpYXQiOjE0NjY2MjQ5NjIsImV4cCI6MTQ2NjcxMTM2MiwiaXNzIjoibXktaXNzdWVyLW5hbWUiLCJqdGkiOiJyazU2c1BPQiJ9.oigrL7Ikbm59TQbGvZnE42MfcWcB_6IGfGHBVW-wR9-OknZjabh2FpO9jwp2tsO4Y7G3EXlfm6-NGiBQIm_iu_yLoytUvfw_xEL5KDRr_YFpVjQ58OdImld2-8Jin-18" \
  http://localhost:3000/custom

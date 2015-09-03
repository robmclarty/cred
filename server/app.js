var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var settings = require('../config/settings');

// Config.
var port = process.env.PORT || 3000;
mongoose.connect(settings.database);
app.set('api-secret', settings.secret);

// Use body-parser to get info from POST and/or URL parameters.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Use morgan to log requests to the console.
app.use(morgan('dev'));

// Routers.
var authRoutes = require('./routes/auth_routes');
var rootRoutes = require('./routes/root_routes');
var userRoutes = require('./routes/user_routes');
var resourceRoutes = require('./routes/resource_routes');

// Non-API routes.
app.get('/', function (req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

// API routes.
app.use('/api', authRoutes);
app.use('/api', rootRoutes);
app.use('/api', userRoutes);
app.use('/api', resourceRoutes);

// Start the server.
app.listen(port);
console.log('Server started at port ' + port);

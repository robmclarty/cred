'use strict';

const authentication = require('../src/authentication');
const authorization = require('../src/authorization');

Object.assign(exports, authentication, authorization);

'use strict';

let Waterline = require('waterline');

let Resource = Waterline.Collection.extend({
  identity: 'resource',
  connection: 'local-mongo',
  tableName: 'resources',
  migrate: 'safe',

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    description: {
      type: 'text',
      defaultsTo: ''
    },
    notes: {
      type: 'text',
      defaultsTo: ''
    }
  }
});

module.exports = Resource;

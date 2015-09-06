var mongoose = require('mongoose');

var ResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  notes: { type: String }
});

module.exports = mongoose.model('Resource', ResourceSchema);

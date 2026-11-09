const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: String,
  location: String,

  icu_total: Number,
  icu_available: Number,

  oxygen_total: Number,
  oxygen_available: Number,

  general_total: Number,
  general_available: Number,

  last_updated: Date
});

module.exports = mongoose.model('Hospital', hospitalSchema);
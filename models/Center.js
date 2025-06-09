const mongoose = require('mongoose');

const centerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
  currentBookings: { type: Number, default: 0 },
});

module.exports = mongoose.model('Center', centerSchema);
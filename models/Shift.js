const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true },
  capacity: { type: Number, required: true },
  currentBookings: { type: Number, default: 0 },
});

module.exports = mongoose.model('Shift', shiftSchema);
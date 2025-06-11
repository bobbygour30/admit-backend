const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  union: { type: String, required: true },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  aadhaarNumber: { type: String, required: true, unique: true },
  selectedPosts: [{ type: String }],
  districtPreferences: [{ type: String }],
  collegeBoard: String,
  percentage: String,
  postDesignation: String,
  timeInYears: String,
  photo: { type: String, required: true },
  signature: { type: String, required: true },
  cv: String,
  workCert: String,
  qualCert: { type: String, required: true },
  idProof: String,
  examCenter: String,
  examShift: String,
  applicationNumber: { type: String, unique: true },
  paymentStatus: { type: Boolean, default: false },
  transactionNumber: String,
  transactionDate: Date,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
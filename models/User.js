const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  union: { type: String, required: true },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  dob: { type: String, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },
  selectedPosts: [{ type: String, required: true }],
  districtPreferences: [{ type: String, required: true }],
  higherEducation: { 
    type: String, 
    required: true,
    enum: ['10', '12th', 'Graduate', 'Postgraduate']
  },
  percentage: { 
    type: String, 
    required: true,
    match: [/^(?:100|[0-9]{1,2})(\.[0-9]{1,2})?$/, 'Invalid percentage format']
  },
  postDesignation: String,
  organizationName: String,
  totalExperience: { 
    type: String,
    match: [/^[0-9]+(\.[0-9]{1,2})?$/, 'Invalid experience format']
  },
  photo: { type: String, required: true },
  signature: { type: String, required: true },
  cv: String,
  workCert: String,
  qualCert: { type: String, required: true },
  idProof: String,
  examCenter: String,
  examShift: String,
  applicationNumber: { type: String, required: true, unique: true },
  paymentStatus: { type: Boolean, default: false },
  transactionNumber: String,
  transactionDate: Date,
  razorpayPaymentId: String,
  razorpayOrderId: String,
  razorpaySignature: String
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize Razorpay instances
const haritRazorpay = new Razorpay({
  key_id: process.env.HARIT_KEY_ID,
  key_secret: process.env.HARIT_KEY_SECRET,
});

const tirhutRazorpay = new Razorpay({
  key_id: process.env.TIRHUT_KEY_ID,
  key_secret: process.env.TIRHUT_KEY_SECRET,
});

// Create Razorpay order
const createOrder = async (req, res, next) => {
  try {
    const { applicationNumber } = req.body;

    if (!applicationNumber) {
      return res.status(400).json({ message: 'Application number is required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const razorpayInstance = user.union === 'Harit Union' ? haritRazorpay : tirhutRazorpay;

    const options = {
      amount: parseInt(process.env.APPLICATION_FEE) * 100, // Convert INR to paise
      currency: 'INR',
      receipt: `receipt_${applicationNumber}`,
      payment_capture: 1,
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({
      order_id: order.id,
      currency: order.currency,
      amount: order.amount,
      union: user.union,
      key_id: user.union === 'Harit Union' ? process.env.HARIT_KEY_ID : process.env.TIRHUT_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// Verify Razorpay payment
const verifyPayment = async (req, res, next) => {
  try {
    const { applicationNumber, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!applicationNumber || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'All payment details are required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const key_secret = user.union === 'Harit Union' ? process.env.HARIT_KEY_SECRET : process.env.TIRHUT_KEY_SECRET;
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    user.paymentStatus = true;
    user.razorpayPaymentId = razorpay_payment_id;
    user.razorpayOrderId = razorpay_order_id;
    user.razorpaySignature = razorpay_signature;
    user.transactionNumber = razorpay_payment_id; // For backward compatibility
    user.transactionDate = new Date(); // Current date
    await user.save();

    res.status(200).json({ message: 'Payment verified successfully', union: user.union });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment };
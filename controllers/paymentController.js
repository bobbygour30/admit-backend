const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

    if (user.union === 'Harit') {
      return res.status(400).json({ message: 'Payment not required for Harit union' });
    }

    if (user.paymentStatus) {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    const options = {
      amount: 10000, // Amount in paise (e.g., 10000 = ₹100)
      currency: 'INR',
      receipt: `receipt_${applicationNumber}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      union: user.union,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create order error:', error);
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { applicationNumber, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!applicationNumber || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required payment details' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.union === 'Harit') {
      return res.status(400).json({ message: 'Payment not required for Harit union' });
    }

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    user.paymentStatus = true;
    await user.save();

    res.status(200).json({ message: 'Payment verified successfully', union: user.union });
  } catch (error) {
    console.error('Verify payment error:', error);
    next(error);
  }
};

module.exports = { createOrder, verifyPayment };
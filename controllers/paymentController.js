const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res, next) => {
  try {
    const { applicationNumber, amount } = req.body;
    console.log('Creating order for:', { applicationNumber, amount });

    if (!applicationNumber || !amount) {
      console.error('Missing required fields:', { applicationNumber, amount });
      return res.status(400).json({ message: 'Application number and amount are required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error('User not found:', applicationNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.paymentStatus) {
      console.log('Payment already completed:', applicationNumber);
      return res.status(400).json({ message: 'Payment already completed' });
    }

    if (user.union === 'Harit' || user.union === 'Harit Union') {
      console.log('Harit user, payment not required:', applicationNumber);
      return res.status(400).json({ message: 'Payment not required for Harit union' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay configuration missing');
      return res.status(500).json({ message: 'Payment gateway configuration error' });
    }

    const orderAmount = Number(amount); // Ensure amount is a number (in paise)
    if (orderAmount !== 60000) {
      console.warn('Invalid amount requested, using default ₹600:', { requested: amount });
    }

    const options = {
      amount: 60000, // ₹600 in paise
      currency: 'INR',
      receipt: `receipt_${applicationNumber}`,
    };

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', { id: order.id, amount: order.amount, currency: order.currency });

    res.status(200).json({
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error('Order creation error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const {
      applicationNumber,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;
    console.log('Verifying payment for:', applicationNumber);

    if (!applicationNumber || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.error('Missing payment verification details');
      return res.status(400).json({ message: 'Payment verification details are required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error('User not found:', applicationNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('Invalid payment signature');
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    user.paymentStatus = true;
    user.razorpayPaymentId = razorpay_payment_id;
    user.razorpayOrderId = razorpay_order_id;
    await user.save();

    console.log('Payment verified:', applicationNumber);
    res.status(200).json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Payment verification error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

module.exports = { createOrder, verifyPayment };
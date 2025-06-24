const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

// Initialize Razorpay instances for Tirhut and Harit Union
const razorpayTirhut = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const razorpayHarit = new Razorpay({
  key_id: process.env.HARIT_RAZORPAY_KEY_ID,
  key_secret: process.env.HARIT_RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res, next) => {
  try {
    const { applicationNumber, amount, union } = req.body;
    console.log('Creating order for:', { applicationNumber, amount, union });

    if (!applicationNumber || !amount || !union) {
      console.error('Missing required fields:', { applicationNumber, amount, union });
      return res.status(400).json({ message: 'Application number, amount, and union are required' });
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

    // Select Razorpay instance based on union
    let razorpayInstance;
    if (union === 'Tirhut') {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('Tirhut Razorpay configuration missing');
        return res.status(500).json({ message: 'Tirhut payment gateway configuration error' });
      }
      razorpayInstance = razorpayTirhut;
    } else if (union === 'Harit' || union === 'Harit Union') {
      if (!process.env.HARIT_RAZORPAY_KEY_ID || !process.env.HARIT_RAZORPAY_KEY_SECRET) {
        console.error('Harit Razorpay configuration missing');
        return res.status(500).json({ message: 'Harit payment gateway configuration error' });
      }
      razorpayInstance = razorpayHarit;
    } else {
      console.error('Invalid union:', union);
      return res.status(400).json({ message: 'Invalid union specified' });
    }

    const orderAmount = Number(amount); // Ensure amount is a number (in paise)
    if (orderAmount !== 60000) {
      console.warn('Invalid amount requested, using default ₹600:', { requested: amount });
    }

    const options = {
      amount: 60000, // ₹600 in paise
      currency: 'INR',
      receipt: `receipt_${applicationNumber}_${union}`,
    };

    const order = await razorpayInstance.orders.create(options);
    console.log('Razorpay order created:', { id: order.id, amount: order.amount, currency: order.currency, union });

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
      union,
    } = req.body;
    console.log('Verifying payment for:', { applicationNumber, union });

    if (!applicationNumber || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !union) {
      console.error('Missing payment verification details');
      return res.status(400).json({ message: 'Payment verification details are required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error('User not found:', applicationNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    // Select Razorpay secret based on union
    const razorpaySecret = union === 'Tirhut' ? process.env.RAZORPAY_KEY_SECRET : process.env.HARIT_RAZORPAY_KEY_SECRET;
    if (!razorpaySecret) {
      console.error('Razorpay secret missing for union:', union);
      return res.status(500).json({ message: 'Payment gateway configuration error' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
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

    console.log('Payment verified:', { applicationNumber, union });
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
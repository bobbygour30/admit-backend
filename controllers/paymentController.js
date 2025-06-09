const User = require('../models/User');

const verifyPayment = async (req, res, next) => {
  try {
    const { applicationNumber, transactionNumber, transactionDate } = req.body;

    if (!applicationNumber || !transactionNumber || !transactionDate) {
      return res.status(400).json({ message: 'All payment details are required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.paymentStatus = true;
    user.transactionNumber = transactionNumber;
    user.transactionDate = new Date(transactionDate);
    await user.save();

    res.status(200).json({ message: 'Payment verified successfully', union: user.union });
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyPayment };
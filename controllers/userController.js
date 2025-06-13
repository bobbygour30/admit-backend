const User = require('../models/User');

const getAllUsers = async (req, res, next) => {
  try {
    console.log('Fetching all users');
    const users = await User.find().select(
      'applicationNumber name email mobile examCenter examShift paymentStatus'
    );
    console.log(`Retrieved ${users.length} users`);
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    next(error);
  }
};

module.exports = { registerUser, uploadDocument, getAllUsers };
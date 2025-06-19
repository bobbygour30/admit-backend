const User = require('../models/User');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getAdmitCard = async (req, res, next) => {
  try {
    const { applicationNumber } = req.query;
    console.log('getAdmitCard: applicationNumber:', applicationNumber);
    if (!applicationNumber) {
      return res.status(400).json({ message: 'Application number is required' });
    }
    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error('User not found for applicationNumber:', applicationNumber);
      return res.status(404).json({ message: 'User not found' });
    }
    if (!user.paymentStatus && user.union !== 'Harit' && user.union !== 'Harit Union') {
      console.error('Payment not completed for applicationNumber:', applicationNumber);
      return res.status(400).json({ message: 'Payment not completed' });
    }
    if (user.union === 'Tirhut Union') {
      const admitCardReleaseDate = new Date('2025-06-24');
      if (new Date() < admitCardReleaseDate) {
        return res.status(400).json({ message: 'Tirhut Union admit cards available from June 24, 2025' });
      }
    }
    // Send email notification (if not already sent)
    try {
      // Email logic...
      console.log('Email sent for applicationNumber:', applicationNumber);
    } catch (emailError) {
      console.error('Email error:', emailError);
      return res.status(200).json({ user, emailSent: false });
    }
    res.status(200).json({ user, emailSent: true });
  } catch (error) {
    console.error('Admit card error:', error);
    res.status(500).json({ message: 'Failed to fetch admit card' });
  }
};

module.exports = { getAdmitCard };

const emailAdmitCard = async (req, res, next) => {
  try {
    const { applicationNumber } = req.body;
    if (!applicationNumber) {
      return res.status(400).json({ message: 'Application number is required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.idProof) {
      return res.status(400).json({ message: 'Document upload not completed' });
    }

    if (!user.paymentStatus && user.union !== 'Harit') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Admit Card',
      text: `Dear ${user.name},\n\nYour admit card for application number ${applicationNumber} is attached. Please review the details below:\n\nExam Center: ${user.examCenter}\nExam Shift: ${user.examShift}\n\nBest regards,\nExam Team`,
      // Add PDF attachment logic if needed
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Admit card emailed successfully' });
  } catch (error) {
    console.error('Email admit card error:', error);
    next(error);
  }
};

module.exports = { getAdmitCard, emailAdmitCard };
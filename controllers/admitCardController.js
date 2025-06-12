const User = require('../models/User');
const transporter = require('../config/email');

const getAdmitCard = async (req, res, next) => {
  try {
    const { applicationNumber } = req.query;

    if (!applicationNumber) {
      console.error('Missing applicationNumber in request');
      return res.status(400).json({ message: 'Application number is required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error(`No user found for applicationNumber: ${applicationNumber}`);
      return res.status(404).json({ message: 'No application found with this number' });
    }

    if (user.union === 'Tirhut Union') {
      const today = new Date();
      const releaseDate = new Date('2025-06-18');
      if (today < releaseDate) {
        console.warn(`Admit card access denied for Tirhut Union, applicationNumber: ${applicationNumber}`);
        return res.status(403).json({ message: 'Admit Card for Tirhut Union will be available from 18th June onwards' });
      }
    }

    if (!user.paymentStatus) {
      console.warn(`Payment not verified for applicationNumber: ${applicationNumber}`);
      return res.status(400).json({ message: 'Payment not verified' });
    }

    // Validate email
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      console.warn(`Invalid or missing email for applicationNumber: ${applicationNumber}`);
      res.status(200).json({ user, emailSent: false });
      return;
    }

    // Check if email was already sent
    if (user.notificationEmailSent) {
      console.log(`Notification email already sent for applicationNumber: ${applicationNumber}`);
      res.status(200).json({ user, emailSent: true });
      return;
    }

    // Send notification email
    let emailSent = false;
    const notificationMailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@cbt2025.com',
      to: user.email,
      subject: 'Admit Card Generation Notification',
      html: `<p>Dear ${user.name || 'Candidate'},</p><p>You have successfully generated your admit card. Your application number is <strong>${applicationNumber}</strong>.</p><p>Regards,<br>CBT 2025 Team</p>`,
    };

    try {
      await transporter.sendMail(notificationMailOptions);
      console.log(`Notification email sent successfully for applicationNumber: ${applicationNumber}`);
      emailSent = true;
      await User.updateOne({ applicationNumber }, { $set: { notificationEmailSent: true } });
    } catch (emailError) {
      console.error(`Failed to send notification email for applicationNumber: ${applicationNumber}`, emailError);
    }

    console.log(`Admit card fetched successfully for applicationNumber: ${applicationNumber}`);
    res.status(200).json({ user, emailSent });
  } catch (error) {
    console.error('Error in getAdmitCard:', {
      message: error.message,
      stack: error.stack,
      applicationNumber: req.query.applicationNumber,
    });
    next(error);
  }
};

module.exports = { getAdmitCard };
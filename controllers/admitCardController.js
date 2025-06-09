const User = require('../models/User');
const transporter = require('../config/email');
const { generatePDF } = require('../utils/generatePDF');

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

    console.log(`Admit card fetched successfully for applicationNumber: ${applicationNumber}`);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getAdmitCard:', {
      message: error.message,
      stack: error.stack,
      applicationNumber: req.query.applicationNumber,
    });
    next(error);
  }
};

const emailAdmitCard = async (req, res, next) => {
  try {
    const { applicationNumber } = req.body;

    if (!applicationNumber) {
      console.error('Missing applicationNumber in email request');
      return res.status(400).json({ message: 'Application number is required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error(`No user found for email, applicationNumber: ${applicationNumber}`);
      return res.status(404).json({ message: 'No application found with this number' });
    }

    if (user.union === 'Tirhut Union') {
      const today = new Date();
      const releaseDate = new Date('2025-06-18');
      if (today < releaseDate) {
        console.warn(`Email admit card denied for Tirhut Union, applicationNumber: ${applicationNumber}`);
        return res.status(403).json({ message: 'Admit Card for Tirhut Union will be available from 18th June onwards' });
      }
    }

    if (!user.paymentStatus) {
      console.warn(`Payment not verified for email, applicationNumber: ${applicationNumber}`);
      return res.status(400).json({ message: 'Payment not verified' });
    }

    const pdfBuffer = await generatePDF(user);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your CBT 2025 Admit Card',
      html: `<p>Dear ${user.name || 'Candidate'},</p><p>Your admit card for CBT 2025 is attached.</p><p><strong>Application Number:</strong> ${user.applicationNumber}</p><p>Regards,<br>CBT 2025 Team</p>`,
      attachments: [
        {
          filename: `admit_card_${user.applicationNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Admit card emailed successfully for applicationNumber: ${applicationNumber}`);
    res.status(200).json({ message: 'Admit card emailed successfully' });
  } catch (error) {
    console.error('Error in emailAdmitCard:', {
      message: error.message,
      stack: error.stack,
      applicationNumber: req.body.applicationNumber,
    });
    next(error);
  }
};

module.exports = { getAdmitCard, emailAdmitCard };
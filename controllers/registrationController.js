const User = require('../models/User');
const Center = require('../models/Center');
const Shift = require('../models/Shift');
const cloudinary = require('../config/cloudinary');

const registerUser = async (req, res, next) => {
  try {
    console.log('Received registration data:', req.body);

    const {
      union, name, fatherName, motherName, dob, gender, email, mobile, address, aadhaarNumber,
      selectedPosts, districtPreferences, collegeBoard, percentage, postDesignation, timeInYears,
      photo, signature, cv, workCert, qualCert,
    } = req.body;

    // Validate required fields
    if (!union || !name || !fatherName || !motherName || !dob || !gender || !email || !mobile || 
        !address || !aadhaarNumber || !photo || !signature || !qualCert || !districtPreferences?.length) {
      console.error('Missing required fields');
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate base64 data
    const isValidBase64 = (data) => {
      if (typeof data !== 'string' || !data.startsWith('data:image/')) {
        return false;
      }
      const base64Data = data.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      if (sizeInMB > 10) {
        console.error(`Base64 data too large: ${sizeInMB.toFixed(2)} MB`);
        return false;
      }
      return true;
    };

    if (!isValidBase64(photo)) {
      console.error('Invalid base64 data for photo');
      return res.status(400).json({ message: 'Invalid photo data format or size exceeds 10MB' });
    }
    if (!isValidBase64(signature)) {
      console.error('Invalid base64 data for signature');
      return res.status(400).json({ message: 'Invalid signature data format or size exceeds 10MB' });
    }
    if (!isValidBase64(qualCert)) {
      console.error('Invalid base64 data for qualCert');
      return res.status(400).json({ message: 'Invalid qualification certificate data format or size exceeds 10MB' });
    }
    if (cv && !isValidBase64(cv)) {
      console.error('Invalid base64 data for cv');
      return res.status(400).json({ message: 'Invalid CV data format or size exceeds 10MB' });
    }
    if (workCert && !isValidBase64(workCert)) {
      console.error('Invalid base64 data for workCert');
      return res.status(400).json({ message: 'Invalid work certificate data format or size exceeds 10MB' });
    }

    // Upload files to Cloudinary
    console.log('Uploading files to Cloudinary');
    const uploadFile = async (dataUrl, folder) => {
      try {
        const result = await cloudinary.uploader.upload(dataUrl, { folder });
        console.log(`Uploaded to ${folder}: ${result.secure_url}`);
        return result.secure_url;
      } catch (error) {
        console.error(`Cloudinary upload error for ${folder}:`, {
          message: error.message,
          name: error.name,
          stack: error.stack,
          error: error,
        });
        throw new Error(`Failed to upload to ${folder}: ${error.message || 'Unknown error'}`);
      }
    };

    const photoUrl = await uploadFile(photo, 'cbt2025/photos');
    const signatureUrl = await uploadFile(signature, 'cbt2025/signatures');
    const qualCertUrl = await uploadFile(qualCert, 'cbt2025/qualCerts');
    const cvUrl = cv ? await uploadFile(cv, 'cbt2025/cvs') : null;
    const workCertUrl = workCert ? await uploadFile(workCert, 'cbt2025/workCerts') : null;

    // Allocate exam center and shift
    console.log('Allocating center and shift');
    const availableCenters = await Center.find({
      $expr: { $lt: ['$currentBookings', '$capacity'] }
    });
    if (!availableCenters.length) {
      console.error('No available centers');
      return res.status(400).json({ message: 'No available exam centers' });
    }
    const center = availableCenters.sort((a, b) => a.currentBookings - b.currentBookings)[0];

    const availableShifts = await Shift.find({
      $expr: { $lt: ['$currentBookings', '$capacity'] }
    });
    if (!availableShifts.length) {
      console.error('No available shifts');
      return res.status(400).json({ message: 'No available shifts' });
    }
    const shift = availableShifts.sort((a, b) => a.currentBookings - b.currentBookings)[0];

    // Generate application number
    console.log('Generating application number');
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const applicationNumber = `CBT${Date.now()}${randomNum}`;

    // Create user
    console.log('Creating user');
    const user = new User({
      union,
      name,
      fatherName,
      motherName,
      dob,
      gender,
      email,
      mobile,
      address,
      aadhaarNumber,
      selectedPosts,
      districtPreferences,
      collegeBoard: collegeBoard || null,
      percentage: percentage || null,
      postDesignation: postDesignation || null,
      timeInYears: timeInYears || null,
      photo: photoUrl,
      signature: signatureUrl,
      cv: cvUrl,
      workCert: workCertUrl,
      qualCert: qualCertUrl,
      examCenter: center.name,
      examShift: `${shift.name} (${shift.time}, ${shift.date})`,
      applicationNumber,
    });

    // Save to database
    console.log('Saving user');
    await user.save();

    // Update center and shift bookings
    console.log('Updating center and shift bookings');
    await Center.updateOne({ _id: center._id }, { $inc: { currentBookings: 1 } });
    await Shift.updateOne({ _id: shift._id }, { $inc: { currentBookings: 1 } });

    console.log('Registration successful:', applicationNumber);
    res.status(201).json({ applicationNumber });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    console.log('Received document upload data:', req.body);
    const { applicationNumber, idProof } = req.body;

    if (!applicationNumber || !idProof) {
      console.error('Missing application number or ID proof');
      return res.status(400).json({ message: 'Application number and ID proof are required' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error('User not found for applicationNumber:', applicationNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Uploading ID proof to Cloudinary');
    const idProofUrl = await cloudinary.uploader.upload(idProof, { folder: 'cbt2025/idProofs' });

    user.idProof = idProofUrl.secure_url;
    console.log('Saving updated user');
    await user.save();

    console.log('Document uploaded successfully');
    res.status(200).json({ message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Document upload error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    next(error);
  }
};

module.exports = { registerUser, uploadDocument };
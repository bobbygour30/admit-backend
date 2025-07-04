const User = require('../models/User');
const Center = require('../models/Center');
const mongoose = require('mongoose');
const Shift = require('../models/Shift');
const cloudinary = require('../config/cloudinary');

const registerUser = async (req, res, next) => {
  try {
    console.log('Received registration data:', req.body);

    const {
      union, name, fatherName, motherName, dob, gender, email, mobile, address, aadhaarNumber,
      selectedPosts, districtPreferences, higherEducation, percentage, postDesignation, organizationName, totalExperience,
      photo, signature, cv, workCert, qualCert,
    } = req.body;

    // Validate required fields
    if (!union || !name || !fatherName || !motherName || !dob || !gender || !email || !mobile || 
        !address || !aadhaarNumber || !selectedPosts?.length || !districtPreferences?.length || 
        !higherEducation || !percentage || !photo || !signature || !qualCert) {
      console.error('Missing required fields');
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Normalize union to 'Harit' or 'Tirhut'
    // Standardize union to 'Harit' or 'Tirhut Union' for consistency
    const normalizedUnion = union === 'Harit Union' ? 'Harit' : union;
    console.log('Normalized union:', normalizedUnion);

    // Validate base64 data with specific size limits
    const isValidBase64 = (data, maxSizeKB, fieldName) => {
      if (typeof data !== 'string' || !data.startsWith('data:')) {
        console.error(`Invalid base64 data for ${fieldName}`);
        return false;
      }
      const base64Data = data.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      const sizeInKB = sizeInBytes / 1024;
      if (sizeInKB > maxSizeKB) {
        console.error(`Base64 data too large for ${fieldName}: ${sizeInKB.toFixed(2)} KB > ${maxSizeKB} KB`);
        return false;
      }
      return true;
    };

    if (!isValidBase64(photo, 200, 'photo')) {
      return res.status(400).json({ message: 'Invalid photo data format or size exceeds 200KB' });
    }
    if (!isValidBase64(signature, 100, 'signature')) {
      return res.status(400).json({ message: 'Invalid signature data format or size exceeds 100KB' });
    }
    if (!isValidBase64(qualCert, 2048, 'qualCert')) {
      return res.status(400).json({ message: 'Invalid qualification certificate data format or size exceeds 2MB' });
    }
    if (cv && !isValidBase64(cv, 2048, 'cv')) {
      return res.status(400).json({ message: 'Invalid CV data format or size exceeds 2MB' });
    }
    if (workCert && !isValidBase64(workCert, 2048, 'workCert')) {
      return res.status(400).json({ message: 'Invalid work certificate data format or size exceeds 2MB' });
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
        });
        throw new Error(`Failed to upload to ${folder}: ${error.message || 'Unknown error'}`);
      }
    };

    const photoUrl = await uploadFile(photo, 'cbt2025/photos');
    const signatureUrl = await uploadFile(signature, 'cbt2025/signatures');
    const qualCertUrl = await uploadFile(qualCert, 'cbt2025/qualCerts');
    const cvUrl = cv ? await uploadFile(cv, 'cbt2025/cvs') : null;
    const workCertUrl = workCert ? await uploadFile(workCert, 'cbt2025/workCerts') : null;

    // Allocate exam center
    console.log('Allocating center');
    const availableCenters = await Center.find({
      $expr: { $lt: ['$currentBookings', '$capacity'] }
    });
    if (!availableCenters.length) {
      console.error('No available centers');
      return res.status(400).json({ message: 'No available exam centers' });
    }
    const center = availableCenters.sort((a, b) => a.currentBookings - b.currentBookings)[0];

    // Allocate shift in order: A, B, C, filtered by union and date
    console.log('Allocating shift for union:', normalizedUnion);
    let shiftQuery = {
      union: normalizedUnion,
      $expr: { $lt: ['$currentBookings', '$capacity'] }
    };
    
    // Apply date filter based on union
    if (normalizedUnion === 'Harit') {
      shiftQuery.date = '2025-07-01'; // Harit users assigned to 1 July 2025
    } else if (normalizedUnion === 'Tirhut Union') {
      shiftQuery.date = '2025-06-29'; // Tirhut users assigned to 29 June 2025
    }

    const availableShifts = await Shift.find(shiftQuery).sort({ name: 1 });
    let selectedShift = null;
    const maxCapacity = normalizedUnion === 'Harit' ? 250 : 150; // Harit: 250, Tirhut: 150

    for (const shift of availableShifts) {
      if (shift.name === 'A' && shift.currentBookings < maxCapacity) {
        selectedShift = shift;
        break;
      } else if (shift.name === 'B' && shift.currentBookings < maxCapacity && !availableShifts.find(s => s.name === 'A' && s.currentBookings < maxCapacity)) {
        selectedShift = shift;
        break;
      } else if (shift.name === 'C' && shift.currentBookings < maxCapacity && !availableShifts.find(s => (s.name === 'A' || s.name === 'B') && s.currentBookings < maxCapacity)) {
        selectedShift = shift;
        break;
      }
    }

    if (!selectedShift) {
      console.error('No available shifts for union:', normalizedUnion);
      return res.status(400).json({ message: `No available shifts for union ${normalizedUnion} on ${normalizedUnion === 'Harit' ? '1 July 2025' : '29 June 2025'}` });
    }

    // Generate application number
    console.log('Generating application number');
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const applicationNumber = `CBT${Date.now()}${randomNum}`;

    // Create user
    console.log('Creating user');
    const user = new User({
      union: normalizedUnion,
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
      higherEducation,
      percentage,
      postDesignation,
      organizationName,
      totalExperience,
      photo: photoUrl,
      signature: signatureUrl,
      cv: cvUrl,
      workCert: workCertUrl,
      qualCert: qualCertUrl,
      examCenter: center.name,
      examShift: `${selectedShift.name} (${selectedShift.time}, ${selectedShift.date})`,
      applicationNumber,
      paymentStatus: false, // Set to false for all users
    });

    // Save user and update bookings atomically
    console.log('Saving user and updating bookings');
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await user.save({ session });
        const updateResult = await Shift.updateOne(
          { _id: selectedShift._id, currentBookings: { $lt: selectedShift.capacity } },
          { $inc: { currentBookings: 1 } },
          { session }
        );
        if (updateResult.matchedCount === 0) {
          throw new Error('Shift is now full');
        }
        await Center.updateOne(
          { _id: center._id, currentBookings: { $lt: center.capacity } },
          { $inc: { currentBookings: 1 } },
          { session }
        );
      });
    } catch (error) {
      console.error('Transaction error:', error);
      return res.status(400).json({ message: `Registration failed: ${error.message || 'Shift or center is full'}` });
    } finally {
      session.endSession();
    }

    console.log('Registration successful:', applicationNumber);
    res.status(201).json({ applicationNumber });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      env: process.env.NODE_ENV,
      mongoUri: process.env.MONGO_URI ? 'Set' : 'Not set',
      cloudinaryConfig: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      },
    });
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const { applicationNumber, idProof } = req.body;
    console.log('uploadDocument: applicationNumber:', applicationNumber);
    if (!applicationNumber || !idProof) {
      console.error('Missing applicationNumber or idProof');
      return res.status(400).json({ message: 'Application number and ID proof are required' });
    }

    // Validate idProof base64
    const isValidBase64 = (data, maxSizeKB) => {
      if (typeof data !== 'string' || !data.startsWith('data:')) {
        console.error('Invalid base64 data for idProof');
        return false;
      }
      const base64Data = data.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      const sizeInKB = sizeInBytes / 1024;
      if (sizeInKB > maxSizeKB) {
        console.error(`Base64 data too large for idProof: ${sizeInKB.toFixed(2)} KB > ${maxSizeKB} KB`);
        return false;
      }
      return true;
    };

    if (!isValidBase64(idProof, 2048, 'idProof')) {
      return res.status(400).json({ message: 'Invalid ID proof data format or size exceeds 2MB' });
    }

    const user = await User.findOne({ applicationNumber });
    if (!user) {
      console.error('User not found for applicationNumber:', applicationNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Uploading idProof to Cloudinary for user:', user._id);
    const idProofUrl = await cloudinary.uploader.upload(idProof, { folder: 'cbt2025/idProofs' });
    user.idProof = idProofUrl.secure_url;

    await user.save();
    console.log('Document uploaded, user details:', {
      applicationNumber,
      union: user.union,
      paymentStatus: user.paymentStatus,
    });

    res.status(200).json({
      message: 'Document uploaded successfully',
      union: user.union,
      paymentStatus: user.paymentStatus,
    });
  } catch (error) {
    console.error('Document upload error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Document upload failed' });
  }
};

const getUser = async (req, res, next) => {
  try {
    const { applicationNumber } = req.query;
    console.log('getUser: applicationNumber:', applicationNumber);
    if (!applicationNumber) {
      console.error('Missing application number');
      return res.status(400).json({ message: 'Application number is required' });
    }
    const user = await User.findOne({ applicationNumber }).select('union paymentStatus');
    console.log('getUser: user found:', user);
    if (!user) {
      console.error('User not found for applicationNumber:', applicationNumber);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('User fetched:', applicationNumber);
    res.status(200).json({ union: user.union, paymentStatus: user.paymentStatus });
  } catch (error) {
    console.error('Error fetching user:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    console.log('Raw request body:', req.body);
    const { username, password } = req.body;
    console.log('Received credentials for getAllUsers:', { username, password });

    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();
    console.log('Trimmed credentials:', { trimmedUsername, trimmedPassword });

    if (trimmedUsername !== 'admin@examportal.com' || trimmedPassword !== 'Admin@2024#') {
      console.error('Invalid admin credentials', { trimmedUsername, trimmedPassword });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Fetching all users');
    const users = await User.find().select(
      'applicationNumber union name fatherName motherName dob gender email mobile address aadhaarNumber ' +
      'selectedPosts districtPreferences higherEducation percentage postDesignation organizationName totalExperience ' +
      'examCenter examShift paymentStatus transactionNumber transactionDate photo signature cv workCert qualCert'
    );
    // Ensure selectedPosts and districtPreferences are arrays
    const sanitizedUsers = users.map(user => ({
      ...user._doc,
      selectedPosts: Array.isArray(user.selectedPosts) ? user.selectedPosts : [],
      districtPreferences: Array.isArray(user.districtPreferences) ? user.districtPreferences : [],
    }));
    console.log(`Retrieved ${sanitizedUsers.length} users`);
    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const { applicationNumber } = req.params;
    console.log('deleteUser: applicationNumber:', applicationNumber, 'credentials:', { username, password });

    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    if (trimmedUsername !== 'admin@examportal.com' || trimmedPassword !== 'Admin@2024#') {
      console.error('Invalid admin credentials', { trimmedUsername, trimmedPassword });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const user = await User.findOne({ applicationNumber }).session(session);
        if (!user) {
          console.error('User not found for applicationNumber:', applicationNumber);
          return res.status(404).json({ message: 'User not found' });
        }

        // Decrement shift and center bookings
        const shiftMatch = user.examShift.match(/^(A|B|C)/);
        const shiftName = shiftMatch ? shiftMatch[1] : null;
        const shiftDate = user.union === 'Harit' ? '2025-07-01' : '2025-06-29';

        if (shiftName) {
          await Shift.updateOne(
            { name: shiftName, union: user.union, date: shiftDate },
            { $inc: { currentBookings: -1 } },
            { session }
          );
        }

        await Center.updateOne(
          { name: user.examCenter },
          { $inc: { currentBookings: -1 } },
          { session }
        );

        // Delete the user
        await User.deleteOne({ applicationNumber }, { session });
        console.log('User deleted:', applicationNumber);
      });

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Transaction error in deleteUser:', error);
      res.status(400).json({ message: `Failed to delete user: ${error.message || 'Unknown error'}` });
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Error deleting user:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = { registerUser, uploadDocument, getUser, getAllUsers, deleteUser };
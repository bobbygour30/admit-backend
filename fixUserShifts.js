require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Shift = require('./models/Shift');
const connectDB = require('./config/db');

const fixUserShifts = async () => {
  try {
    await connectDB();
    const users = await User.find({});
    for (const user of users) {
      const shiftName = user.examShift?.split(' ')[0];
      if (!shiftName) continue;
      const shift = await Shift.findOne({ name: shiftName, union: user.union });
      if (!shift) {
        console.log(`No shift found for user ${user._id}`);
        continue;
      }
      user.examShift = `${shift.name} (${shift.time}, ${shift.date})`;
      await user.save();
      console.log(`Fixed user ${user._id}: ${user.examShift}`);
    }
    console.log('User shifts fixed');
    process.exit();
  } catch (error) {
    console.error('Error fixing shifts:', error);
    process.exit(1);
  }
};

fixUserShifts();
const mongoose = require('mongoose');
const Center = require('./models/Center');
const Shift = require('./models/Shift');
const connectDB = require('./config/db');
require('dotenv').config();

const centers = [
  { name: 'Tech Exmavive Pvt.Ltd , Behind Vinay Tata Motors , Elahibagh , Bariya ,Patna:800007', location: 'Bihar', capacity: 750, currentBookings: 0 },
];

const shifts = [
  { name: 'A', time: '9:00 AM - 10:00 AM', date: '23-06-2025', capacity: 150, currentBookings: 0 },
  { name: 'B', time: '12:00 PM - 1:00 PM', date: '23-06-2025', capacity: 150, currentBookings: 0 },
  { name: 'C', time: '3:00 PM - 4:00 PM', date: '23-06-2025', capacity: 150, currentBookings: 0 },
];

const seedDB = async () => {
  try {
    await connectDB();
    // Drop problematic index if it exists
    await Shift.collection.dropIndex('id_1').catch((err) => {
      if (err.codeName !== 'IndexNotFound') {
        console.error('Error dropping index:', err);
      }
    });
    await Center.deleteMany({});
    await Shift.deleteMany({});
    await Center.insertMany(centers);
    await Shift.insertMany(shifts);
    console.log('Database seeded');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
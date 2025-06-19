const mongoose = require('mongoose');
const Center = require('./models/Center');
const Shift = require('./models/Shift');
const connectDB = require('./config/db');
require('dotenv').config();

const centers = [
  {
    name: 'Tech Exmavive Pvt.Ltd , Behind Vinay Tata Motors , Elahibagh , Bariya ,Patna:800007',
    location: 'Bihar',
    capacity: 750,
    currentBookings: 0,
  },
];

const shifts = [
  // Shifts for Harit Union (23 June 2025)
  { name: 'A', time: '9:00 AM - 10:00 AM', date: '2025-06-23', capacity: 150, currentBookings: 0, union: 'Harit' },
  { name: 'B', time: '12:00 PM - 1:00 PM', date: '2025-06-23', capacity: 150, currentBookings: 0, union: 'Harit' },
  { name: 'C', time: '3:00 PM - 4:00 PM', date: '2025-06-23', capacity: 150, currentBookings: 0, union: 'Harit' },
  // Shifts for Tirhut Union (29 June 2025)
  { name: 'A', time: '9:00 AM - 10:00 AM', date: '2025-06-29', capacity: 150, currentBookings: 0, union: 'Tirhut Union' },
  { name: 'B', time: '12:00 PM - 1:00 PM', date: '2025-06-29', capacity: 150, currentBookings: 0, union: 'Tirhut Union' },
  { name: 'C', time: '3:00 PM - 4:00 PM', date: '2025-06-29', capacity: 150, currentBookings: 0, union: 'Tirhut Union' },
];

const seedDB = async () => {
  try {
    await connectDB();
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
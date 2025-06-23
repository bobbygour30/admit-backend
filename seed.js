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
  // Shifts for Harit Union (23 June 2025, existing, capacity: 150)
  { name: 'A', time: '9:00 AM - 10:00 AM', date: '2025-06-23', capacity: 150, currentBookings: 0, union: 'Harit' },
  { name: 'B', time: '12:00 PM - 1:00 PM', date: '2025-06-23', capacity: 150, currentBookings: 0, union: 'Harit' },
  { name: 'C', time: '3:00 PM - 4:00 PM', date: '2025-06-23', capacity: 150, currentBookings: 0, union: 'Harit' },
  // New Shifts for Harit Union (1 July 2025, capacity: 250)
  { name: 'A', time: '9:00 AM - 10:00 AM', date: '2025-07-01', capacity: 250, currentBookings: 0, union: 'Harit' },
  { name: 'B', time: '12:00 PM - 1:00 PM', date: '2025-07-01', capacity: 250, currentBookings: 0, union: 'Harit' },
  { name: 'C', time: '3:00 PM - 4:00 PM', date: '2025-07-01', capacity: 250, currentBookings: 0, union: 'Harit' },
  // Shifts for Tirhut Union (29 June 2025, capacity: 150)
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

    // Insert centers only if they don't exist
    for (const center of centers) {
      const exists = await Center.findOne({ name: center.name });
      if (!exists) {
        await Center.create(center);
      }
    }

    // Insert shifts only if they don't already exist
    for (const shift of shifts) {
      const exists = await Shift.findOne({ 
        union: shift.union, 
        name: shift.name, 
        date: shift.date 
      });
      if (!exists) {
        await Shift.create(shift);
      }
    }

    console.log('Database seeded with Harit Union shifts for 23 June 2025 (150 capacity), 1 July 2025 (250 capacity), and Tirhut Union shifts for 29 June 2025 (150 capacity)');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
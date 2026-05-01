// Exact same setup as server.js — dotenv, then mongoose, then model, then query
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('URI:', uri);
console.log('Mongoose version:', mongoose.version);

(async () => {
  try {
    console.log('Connecting...');
    await mongoose.connect(uri, {
      dbName: 'ethara_ai',
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected! readyState:', mongoose.connection.readyState);
    console.log('DB name:', mongoose.connection.db.databaseName);

    // Register model the same way user.model.js does
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
    });
    const User = mongoose.model('TestUser', userSchema, 'users');

    console.log('Running findOne...');
    const user = await User.findOne({ email: 'gunjitnegi@gmail.com' });
    console.log('Result:', user ? { name: user.name, email: user.email, role: user.role } : 'NOT FOUND');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();

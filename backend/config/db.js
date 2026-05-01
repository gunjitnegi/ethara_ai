const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is missing");
  process.exit(1);
}

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, {
      dbName: 'ethara_ai',
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Connected successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    // Don't exit immediately, maybe it can retry or we can see the error
    throw error;
  }
};

module.exports = { connectDB };

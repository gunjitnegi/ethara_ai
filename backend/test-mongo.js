const mongoose = require('mongoose');
require('dotenv').config();

const testDb = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB');
    
    const collections = await mongoose.connection.db.collections();
    console.log('Collections:', collections.map(c => c.collectionName));
    
    process.exit(0);
  } catch (err) {
    console.error('Connection/Query error:', err);
    process.exit(1);
  }
}

testDb();

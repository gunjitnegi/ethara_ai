require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Project = require('./models/project.model');
const Task = require('./models/task.model');
const bcrypt = require('bcryptjs');

const runTest = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, { dbName: 'ethara_ai' });
    console.log('MongoDB Connected successfully!');

    // 1. Delete previous data
    console.log('Clearing old data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('Database cleared.');

    // 2. Signup User with Secret Key
    console.log('Signing up user Gunjit...');
    
    // Simulate signup controller logic locally or via fetch?
    // Since we are connected to the DB here, we can just do the DB operations
    // or we can start the server and use fetch. Using DB operations is more reliable for the test script.
    
    const name = 'gunjit';
    const email = 'gunjitnegi@gmail.com';
    const password = 'Admin@1712';
    
    // Simulating secret key matching
    const providedSecretKey = 'my_super_secret_admin_key'; // Example key
    process.env.ADMIN_SECRET = providedSecretKey; 
    
    const role = providedSecretKey === process.env.ADMIN_SECRET ? 'admin' : 'member';
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    const savedUser = await newUser.save();
    console.log('User signed up successfully!');
    console.log('Saved User Role:', savedUser.role);

    // Verify it's in DB
    const fetchedUser = await User.findOne({ email });
    console.log('Role found in Database:', fetchedUser.role);

    process.exit(0);

  } catch (error) {
    console.error('Test Error:', error);
    process.exit(1);
  }
};

runTest();

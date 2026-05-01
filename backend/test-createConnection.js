const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

function getUriForDb(dbName) {
  if (uri.includes('?')) {
    const parts = uri.split('?');
    const path = parts[0].endsWith('/') ? parts[0] : `${parts[0]}/`;
    return `${path}${dbName}?${parts[1]}`;
  }
  return uri.endsWith('/') ? `${uri}${dbName}` : `${uri}/${dbName}`;
}

const authConnection = mongoose.createConnection(getUriForDb('authDB'));

const userSchema = new mongoose.Schema({ name: String, email: String });
const User = authConnection.model('User', userSchema);

authConnection.on('connected', async () => {
  console.log('Connected to authDB');
  try {
    const user = await User.findOne({ email: 'test@test.com' });
    console.log('User:', user);
    
    const newUser = new User({ name: 'Test', email: 'test@test.com' });
    await newUser.save();
    console.log('Saved user!');
    
    process.exit(0);
  } catch (err) {
    console.error('Query error:', err);
    process.exit(1);
  }
});

authConnection.on('error', (err) => {
  console.error('Connection error:', err);
  process.exit(1);
});

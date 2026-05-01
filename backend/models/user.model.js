const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  profilePhoto: { type: String, default: '' }, // base64 or URL
  sessions: [{
    sessionId: { type: String, required: true },
    device: String,
    browser: String,
    ip: String,
    lastActive: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;

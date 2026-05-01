const mongoose = require('mongoose');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UAParser = require('ua-parser-js');
const { v4: uuidv4 } = require('uuid');

const signup = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Role Escalation Protection: STRICT check for Admin role
    const ADMIN_SECRET = process.env.ADMIN_SECRET;
    let role = 'member';
    
    // Only allow admin if ADMIN_SECRET is actually set in .env and matches perfectly
    if (secretKey && ADMIN_SECRET && secretKey === ADMIN_SECRET && ADMIN_SECRET.length > 0) {
      role = 'admin';
    } else {
      role = 'member';
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', role });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Record Session
    const parser = new UAParser(req.headers['user-agent']);
    const browser = parser.getBrowser().name || 'Unknown Browser';
    const os = parser.getOS().name || 'Unknown OS';
    const sessionId = uuidv4();

    user.sessions.push({
      sessionId,
      device: os,
      browser: browser,
      ip: req.ip || req.connection.remoteAddress,
      lastActive: new Date()
    });
    
    // Keep only last 5 sessions for security/cleanup
    if (user.sessions.length > 5) user.sessions.shift();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto || '',
        sessionId
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('sessions');
    res.status(200).json(user.sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // Keep only current session
    user.sessions = user.sessions.filter(s => s.sessionId === req.user.sessionId);
    await user.save();
    res.status(200).json({ message: 'Logged out from other devices' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users (admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -sessions');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload profile photo (base64)
const uploadPhoto = async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ message: 'No photo provided' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: photo },
      { returnDocument: 'after' }
    ).select('-password');

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto
    });
  } catch (error) {
    console.error('Upload Photo Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Admin] Attempting to delete user: ${id}`);
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      console.log(`[Admin] Delete failed: User ${id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      console.log(`[Admin] Delete failed: User ${id} is an admin`);
      return res.status(403).json({ message: 'Cannot delete an admin user' });
    }

    // Use mongoose.model to avoid circular dependency/initialization issues
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');

    // 1. Remove user from all project members arrays
    await Project.updateMany(
      { members: id },
      { $pull: { members: id } }
    );
    console.log(`[Admin] Cleaned up projects for user: ${id}`);

    // 2. Unassign user from all tasks
    await Task.updateMany(
      { assignedTo: id },
      { $unset: { assignedTo: 1 } }
    );
    console.log(`[Admin] Cleaned up tasks for user: ${id}`);

    // 3. Delete the user
    await User.findByIdAndDelete(id);
    console.log(`[Admin] Successfully deleted user: ${id}`);

    res.status(200).json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  getSessions,
  logoutAll,
  getAllUsers,
  uploadPhoto,
  deleteUser,
  changePassword
};

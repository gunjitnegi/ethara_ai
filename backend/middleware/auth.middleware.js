const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(403).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user to ensure they still exist and get fresh role
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // SESSION VALIDATION: Check if this session is still active in the DB
    const isSessionActive = user.sessions.some(s => s.sessionId === decoded.sessionId);
    if (!isSessionActive) {
      return res.status(401).json({ message: 'Session expired or logged out' });
    }

    req.user = user.toObject();
    req.user.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Require Admin Role' });
  }
};

module.exports = {
  verifyToken,
  isAdmin
};

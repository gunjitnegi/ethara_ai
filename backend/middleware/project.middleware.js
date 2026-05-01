const Project = require('../models/project.model');

/**
 * Middleware to check if the authenticated user is a member of the project.
 * Prevents IDOR (Insecure Direct Object Reference) attacks.
 */
const checkProjectMembership = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    // Admins have bypass access
    if (req.user.role === 'admin') {
      return next();
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member
    const isMember = project.members.some(memberId => memberId.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    next();
  } catch (error) {
    console.error('Membership Check Error:', error);
    res.status(500).json({ message: 'Security check failed', error: error.message });
  }
};

module.exports = { checkProjectMembership };

const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');

// Admin only: create project
const createProject = async (req, res) => {
  try {
    const { name, description, deadline } = req.body;
    
    const cleanDeadline = deadline && deadline.trim() !== '' ? deadline : undefined;
    
    const newProject = new Project({
      name,
      description,
      deadline: cleanDeadline,
      createdBy: req.user._id,
      members: []
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin and Member: get projects
const getProjects = async (req, res) => {
  try {
    let projects;
    if (req.user.role === 'admin') {
      projects = await Project.find({ createdBy: req.user._id });
    } else {
      projects = await Project.find({ members: req.user._id });
    }
    
    // Populate member data for both admin and member views
    const users = await User.find().select('_id name email role profilePhoto');
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = { 
      _id: u._id.toString(), name: u.name, email: u.email, role: u.role, profilePhoto: u.profilePhoto || ''
    });
    
    const populatedProjects = projects.map(p => {
      const pObj = p.toObject();
      pObj.members = pObj.members.map(m => m.toString());
      pObj.membersData = pObj.members.map(mId => userMap[mId] || { _id: mId, name: 'Unknown' });
      // Include admin/creator info for member view
      if (pObj.createdBy && userMap[pObj.createdBy.toString()]) {
        pObj.creatorData = userMap[pObj.createdBy.toString()];
      }
      return pObj;
    });
    
    return res.status(200).json(populatedProjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin only: delete project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await Project.findOneAndDelete({ _id: id, createdBy: req.user._id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found or unauthorized' });
    }

    await Task.deleteMany({ projectId: id });
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin only: add member
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const project = await Project.findOne({ _id: id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Compare as strings to avoid ObjectId mismatch
    const memberStrings = project.members.map(m => m.toString());
    if (!memberStrings.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Add Member Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin only: remove member
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findOne({ _id: id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Filter using toString() comparison
    project.members = project.members.filter(mId => mId.toString() !== userId);
    await project.save();

    res.status(200).json({ message: 'Member removed', project });
  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  deleteProject,
  addMember,
  removeMember
};

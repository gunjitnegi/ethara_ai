const Task = require('../models/task.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

// Admin only: create task
const createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, deadline, priority } = req.body;
    
    // Verify project belongs to admin
    const project = await Project.findOne({ _id: projectId, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Sanitize optional fields (empty string → undefined)
    const cleanAssignedTo = assignedTo && assignedTo.trim() !== '' ? assignedTo : undefined;
    const cleanDeadline = deadline && deadline.trim() !== '' ? deadline : undefined;

    // Validate task deadline against project deadline
    if (cleanDeadline && project.deadline) {
      const taskDate = new Date(cleanDeadline);
      const projDate = new Date(project.deadline);
      if (taskDate > projDate) {
        return res.status(400).json({ 
          message: `Task deadline cannot be after project deadline (${projDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` 
        });
      }
    }

    // Verify assigned user is in the project or is the admin creator
    if (cleanAssignedTo) {
      const memberIds = project.members.map(m => m.toString());
      const isCreator = cleanAssignedTo === req.user._id.toString();
      if (!isCreator && !memberIds.includes(cleanAssignedTo)) {
        return res.status(400).json({ message: 'Assigned user must be a member of the project' });
      }
    }

    const newTask = new Task({
      title,
      description,
      projectId,
      assignedTo: cleanAssignedTo,
      deadline: cleanDeadline,
      priority: priority || 'medium',
      createdBy: req.user._id
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin and Member: get tasks
// Admin sees all tasks they created.
// Member sees ALL tasks in projects they belong to (not just their own).
const getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'admin') {
      tasks = await Task.find({ createdBy: req.user._id });
    } else {
      // Find all projects the member belongs to
      const memberProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = memberProjects.map(p => p._id);
      // Get ALL tasks in those projects
      tasks = await Task.find({ projectId: { $in: projectIds } });
    }

    // Build project name + deadline map
    const allProjectIds = [...new Set(tasks.map(t => t.projectId.toString()))];
    const projects = await Project.find({ _id: { $in: allProjectIds } }).select('_id name deadline');
    const projectMap = {};
    projects.forEach(p => {
      projectMap[p._id.toString()] = { name: p.name, deadline: p.deadline };
    });

    // Build user map (include profilePhoto)
    const users = await User.find().select('_id name email profilePhoto');
    const userMap = {};
    users.forEach(u => userMap[u._id.toString()] = { 
      name: u.name, email: u.email, profilePhoto: u.profilePhoto || '' 
    });

    const populatedTasks = tasks.map(t => {
      const tObj = t.toObject();
      const pData = projectMap[tObj.projectId.toString()];
      tObj.projectName = pData ? pData.name : 'Unknown';
      tObj.projectDeadline = pData ? pData.deadline : null;
      if (tObj.assignedTo && userMap[tObj.assignedTo.toString()]) {
        tObj.assigneeData = userMap[tObj.assignedTo.toString()];
      }
      return tObj;
    });

    res.status(200).json(populatedTasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Member or Admin: update task status
// Notifies the admin AND all other project members when status changes.
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const task = await Task.findOne({ _id: id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Members can only update their own tasks
    if (req.user.role === 'member') {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized: not assigned to this task' });
      }
    }

    const oldStatus = task.status;
    task.status = status;
    await task.save();

    // Send notifications to admin + all project members (except the person who made the change)
    if (oldStatus !== status) {
      const triggerUser = await User.findById(req.user._id).select('name');
      const triggerName = triggerUser ? triggerUser.name : 'Someone';
      
      const isComplete = status === 'done';
      const message = isComplete
        ? `${triggerName} completed task "${task.title}"`
        : `${triggerName} updated "${task.title}" to ${status.replace('-', ' ')}`;

      // Gather all people to notify: admin (createdBy) + all project members
      const project = await Project.findById(task.projectId).select('members createdBy');
      const recipientIds = new Set();

      // Always notify admin
      if (project?.createdBy) {
        recipientIds.add(project.createdBy.toString());
      }

      // Notify all project members
      if (project?.members) {
        project.members.forEach(m => recipientIds.add(m.toString()));
      }

      // Remove the person who triggered the change
      recipientIds.delete(req.user._id.toString());

      // Create notifications for all recipients
      const notifications = [...recipientIds].map(userId => ({
        userId,
        message,
        type: isComplete ? 'task_complete' : 'task_update',
        taskId: task._id,
        projectId: task.projectId,
        triggeredBy: req.user._id
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin only: delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, createdBy: req.user._id });
    
    if (!task) return res.status(404).json({ message: 'Task not found or unauthorized' });

    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTaskStatus,
  deleteTask
};

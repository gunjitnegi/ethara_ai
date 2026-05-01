const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Project' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'low', 'medium', 'high'], default: 'Medium' },
  deadline: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;

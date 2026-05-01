const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  message: { type: String, required: true },
  type: { type: String, enum: ['task_update', 'task_complete', 'member_added', 'general'], default: 'general' },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;

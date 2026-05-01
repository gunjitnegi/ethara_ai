const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTaskStatus, deleteTask } = require('../controllers/task.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.post('/', verifyToken, isAdmin, createTask);
router.get('/', verifyToken, getTasks);
router.patch('/:id', verifyToken, updateTaskStatus); // member updates status
router.delete('/:id', verifyToken, isAdmin, deleteTask);

module.exports = router;

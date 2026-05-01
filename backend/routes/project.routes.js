const express = require('express');
const router = express.Router();
const { createProject, getProjects, deleteProject, addMember, removeMember } = require('../controllers/project.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.post('/', verifyToken, isAdmin, createProject);
router.get('/', verifyToken, getProjects);
router.delete('/:id', verifyToken, isAdmin, deleteProject);
router.post('/:id/members', verifyToken, isAdmin, addMember);
router.delete('/:id/members/:userId', verifyToken, isAdmin, removeMember);

module.exports = router;

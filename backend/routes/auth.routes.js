const express = require('express');
const router = express.Router();
const { signup, login, getAllUsers, uploadPhoto, deleteUser, changePassword, getSessions, logoutAll } = require('../controllers/auth.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/sessions', verifyToken, getSessions);
router.delete('/sessions/logout-all', verifyToken, logoutAll);
router.get('/users', verifyToken, getAllUsers);
router.post('/upload-photo', verifyToken, uploadPhoto);
router.patch('/change-password', verifyToken, changePassword);
router.delete('/users/:id', verifyToken, isAdmin, deleteUser);

module.exports = router;

const express = require('express');
const { updateUser, deleteUser, getUserById, getAllActiveUsers, createUser } = require('../controllers/user-controller');
const { authenticateToken } = require('../middlewares/auth-middleware');
const { isAdmin } = require('../middlewares/role.middleware');

const router = express.Router();

router.post('/', authenticateToken, isAdmin, createUser);

router.get('/:id', authenticateToken, isAdmin, getUserById);
router.get('/', authenticateToken, isAdmin, getAllActiveUsers);

router.patch('/', authenticateToken, updateUser);
router.patch('/:id', authenticateToken, isAdmin, updateUser);

router.delete('/:id', authenticateToken, isAdmin, deleteUser);
router.delete('/', authenticateToken, isAdmin, deleteUser);

module.exports = router;

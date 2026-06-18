const express = require('express');
const router = express.Router();
const { getUsers, getReaders, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/readers', protect, authorize('admin', 'librarian'), getReaders);

// Áp dụng middleware protect (phải đăng nhập) và authorize (phải là admin) cho tất cả các route ở dưới
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;

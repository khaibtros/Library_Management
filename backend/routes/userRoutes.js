const express = require('express');
const router = express.Router();
const { getUsers, getReaders, getReaderById, createReader, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/readers', protect, authorize('admin', 'librarian'), getReaders);
router.get('/readers/:id', protect, authorize('admin', 'librarian'), getReaderById);
router.post('/readers', protect, authorize('admin', 'librarian'), createReader);

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

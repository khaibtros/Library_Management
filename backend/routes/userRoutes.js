const express = require('express');
const router = express.Router();
const { getMe, updateMe, getUsers, getReaders, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Ho so ca nhan: MOI role da dang nhap deu duoc xem/sua cua chinh minh.
// Dat TRUOC middleware authorize('admin') o duoi, neu khong reader se bi chan.
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

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

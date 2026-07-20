const express = require('express');
const router = express.Router();
const { getMe, updateMe, updateMyAvatar, getUsers, getReaders, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadAvatar } = require('../middleware/uploadMiddleware');

// Ho so ca nhan: MOI role da dang nhap deu duoc xem/sua cua chinh minh.
// Dat TRUOC middleware authorize('admin') o duoi, neu khong reader se bi chan.
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

// Upload avatar rieng (multipart/form-data, field name 'avatar').
// Bat loi tu multer (sai dinh dang / qua 2MB) va tra ve 400 thay vi
// de Express crash voi loi khong bat.
router.post('/me/avatar', protect, (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, updateMyAvatar);

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

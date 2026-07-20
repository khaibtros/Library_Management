const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { isValidName, isValidPhone } = require('../utils/validators');

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  studentId: user.studentId,
  phone: user.phone,
  address: user.address,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
});

// @desc    Lay thong tin ho so cua chinh minh
// @route   GET /api/users/me
// @access  Private (moi role da dang nhap)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    res.json(sanitizeUser(user));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cap nhat ho so cua chinh minh: chi Ho ten / Phone / Address
//          (+ doi mat khau rieng). KHONG cho sua Email / Student ID / Role.
// @route   PUT /api/users/me
// @access  Private (moi role da dang nhap)
const updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    if (req.body.name !== undefined) {
      if (!isValidName(req.body.name)) {
        return res.status(400).json({ message: 'Họ tên phải từ 3-50 ký tự' });
      }
      user.name = req.body.name.trim();
    }

    if (req.body.phone !== undefined) {
      if (!isValidPhone(req.body.phone)) {
        return res.status(400).json({ message: 'Số điện thoại chỉ chứa số, gồm 10 hoặc 11 số' });
      }
      user.phone = req.body.phone.trim();
    }

    if (req.body.address !== undefined) {
      user.address = req.body.address.trim();
    }

    if (req.body.newPassword) {
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      }
      if (!req.body.currentPassword || !(await user.matchPassword(req.body.currentPassword))) {
        return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
      }
      user.password = req.body.newPassword;
    }

    const updated = await user.save();
    res.json(sanitizeUser(updated));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Upload/cap nhat anh dai dien. File da duoc multer kiem tra
//          dinh dang (jpg/jpeg/png/webp) va dung luong (<=2MB) truoc do.
// @route   POST /api/users/me/avatar
// @access  Private (moi role da dang nhap)
const updateMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh (jpg, jpeg, png, webp, tối đa 2MB)' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    // Xoa avatar cu (neu co va la file local) de tranh rac file
    if (user.avatar) {
      const oldPath = path.join(__dirname, '..', user.avatar.replace(/^\//, ''));
      fs.unlink(oldPath, () => {});
    }

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    const updated = await user.save();
    res.json(sanitizeUser(updated));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Lấy danh sách tất cả user
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getReaders = async (req, res) => {
  try {
    const readers = await User.find({ role: 'reader' })
      .select('_id name email')
      .sort({ name: 1 });
    res.json(readers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách độc giả', error: error.message });
  }
};

// @desc    Thêm user mới (bởi Admin)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Cập nhật thông tin/role của user (kèm đổi mật khẩu nếu có)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    if (req.body.newPassword) {
      if (req.body.newPassword.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      }
      user.password = req.body.newPassword;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Xóa user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
    }
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Đã xóa user thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  getMe,
  updateMe,
  updateMyAvatar,
  getUsers,
  getReaders,
  createUser,
  updateUser,
  deleteUser,
};

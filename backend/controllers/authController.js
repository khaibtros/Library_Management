const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Tạo JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Đăng nhập user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Đăng ký tài khoản độc giả (public)
// @route   POST /api/auth/register
// @access  Public
// Lưu ý bảo mật: đăng ký công khai LUÔN tạo role 'reader', bất kể client gửi
// gì trong body. Tài khoản admin/librarian chỉ được tạo bởi admin thông qua
// route riêng POST /api/users (xem userController.createUser).
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User đã tồn tại' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'reader',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu user không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
};

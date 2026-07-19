const User = require('../models/User');
const jwt = require('jsonwebtoken');
const {
  isValidName,
  isValidEmail,
  isValidStudentId,
  isValidPhone,
  isStrongPassword,
} = require('../utils/validators');

// Tạo JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

const toUserResponse = (user) => ({
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

// @desc    Đăng nhập user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email) return res.status(400).json({ message: 'Vui lòng nhập email' });
  if (!password) return res.status(400).json({ message: 'Vui lòng nhập mật khẩu' });

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    if (!(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
    }

    res.json({
      token: generateToken(user._id),
      user: toUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Đăng ký tài khoản độc giả (public)
// @route   POST /api/auth/register
// @access  Public
// Lưu ý bảo mật: đăng ký công khai LUÔN tạo role 'reader' (tương ứng "user"
// trong đặc tả), status 'active', bất kể client gửi gì trong body. Tài
// khoản admin/librarian chỉ được tạo bởi admin qua POST /api/users.
const registerUser = async (req, res) => {
  const { name, email, studentId, phone, address, password, confirmPassword } = req.body;

  try {
    // --- Validate tung truong ---
    if (!isValidName(name)) {
      return res.status(400).json({ message: 'Họ tên không được để trống và phải từ 3-50 ký tự' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Email không được để trống' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email không đúng định dạng' });
    }
    if (!studentId || !studentId.trim()) {
      return res.status(400).json({ message: 'Mã sinh viên không được để trống' });
    }
    if (!isValidStudentId(studentId)) {
      return res.status(400).json({ message: 'Mã sinh viên phải từ 6-20 ký tự' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'Số điện thoại chỉ chứa số, gồm 10 hoặc 11 số' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: 'Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt',
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Xác nhận mật khẩu không khớp' });
    }

    // --- Kiem tra trung lap ---
    const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    const studentIdExists = await User.findOne({ studentId: studentId.trim() });
    if (studentIdExists) {
      return res.status(400).json({ message: 'Mã sinh viên đã tồn tại' });
    }

    // Mat khau duoc hash tu dong o User model (pre-save hook, dung bcrypt)
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      studentId: studentId.trim(),
      phone: phone.trim(),
      address: address ? address.trim() : '',
      password,
      role: 'reader',
      status: 'active',
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: toUserResponse(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc mã sinh viên đã tồn tại' });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
};

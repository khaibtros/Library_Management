const User = require('../models/User');

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
    const { search, page, limit } = req.query;
    const query = { role: 'reader' };
    if (search) { const pattern = new RegExp(search, 'i'); query.$or = [{ name: pattern }, { email: pattern }]; }
    const requestedPaging = page || limit;
    if (!requestedPaging) return res.json(await User.find(query).select('_id name email').sort({ name: 1 }));
    const pageNumber = Math.max(1, Number(page) || 1); const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const [count, data] = await Promise.all([User.countDocuments(query), User.find(query).select('_id name email createdAt').sort({ name: 1 }).skip((pageNumber - 1) * pageSize).limit(pageSize)]);
    return res.json({ success: true, count, page: pageNumber, totalPages: Math.ceil(count / pageSize), data });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách độc giả', error: error.message });
  }
};

const getReaderById = async (req, res) => {
  try {
    const reader = await User.findOne({ _id: req.params.id, role: 'reader' }).select('_id name email createdAt');
    if (!reader) return res.status(404).json({ message: 'Không tìm thấy độc giả' });
    const BorrowCard = require('../models/BorrowCard');
    const borrowCards = await BorrowCard.find({ reader: reader._id }).populate('borrowedBooks.book', 'title author isbn').sort({ createdAt: -1 });
    return res.json({ ...reader.toObject(), borrowCards });
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

const createReader = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) return res.status(400).json({ message: 'Tên, email và mật khẩu tối thiểu 6 ký tự là bắt buộc' });
    if (await User.exists({ email })) return res.status(400).json({ message: 'Email đã được sử dụng' });
    const reader = await User.create({ name: name.trim(), email: email.trim(), password, role: 'reader' });
    return res.status(201).json({ _id: reader._id, name: reader.name, email: reader.email, role: reader.role });
  } catch (error) { return res.status(400).json({ message: error.message }); }
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
  getUsers,
  getReaders,
  getReaderById,
  createReader,
  createUser,
  updateUser,
  deleteUser,
};

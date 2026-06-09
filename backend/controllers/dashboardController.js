const User = require('../models/User');
const Book = require('../models/Book');

// @desc    Lấy dữ liệu thống kê cho Dashboard
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    // Tổng số lượng sách
    const totalBooks = await Book.countDocuments();

    // Tổng số lượng user
    const totalUsers = await User.countDocuments();

    // Thống kê user theo role
    const adminCount = await User.countDocuments({ role: 'admin' });
    const librarianCount = await User.countDocuments({ role: 'librarian' });
    const readerCount = await User.countDocuments({ role: 'reader' });

    res.json({
      totalBooks,
      users: {
        total: totalUsers,
        admin: adminCount,
        librarian: librarianCount,
        reader: readerCount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};

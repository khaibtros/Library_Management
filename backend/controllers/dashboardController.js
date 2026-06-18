const User = require('../models/User');
const Book = require('../models/Book');
const BorrowCard = require('../models/BorrowCard');

// @desc    Lấy dữ liệu thống kê cho Dashboard
// @route   GET /api/dashboard/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();

    const adminCount = await User.countDocuments({ role: 'admin' });
    const librarianCount = await User.countDocuments({ role: 'librarian' });
    const readerCount = await User.countDocuments({ role: 'reader' });

    const totalBorrowed = await BorrowCard.countDocuments({ status: 'borrowed' });
    const totalOverdue = await BorrowCard.countDocuments({ status: 'overdue' });
    const totalReturned = await BorrowCard.countDocuments({ status: 'returned' });
    const totalCancelled = await BorrowCard.countDocuments({ status: 'cancelled' });

    const booksByCategory = await Book.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $and: [{ $ne: ['$category', null] }, { $ne: ['$category', ''] }] },
              '$category',
              'Chưa phân loại'
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentBorrows = await BorrowCard.find()
      .populate('reader', 'name email')
      .populate('borrowedBooks.book', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const currentYear = new Date().getFullYear();
    const monthlyBorrows = await BorrowCard.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthlyLabels = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
                           'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
    const monthlyData = Array(12).fill(0);
    monthlyBorrows.forEach(item => {
      monthlyData[item._id - 1] = item.count;
    });

    res.json({
      totalBooks,
      totalBorrowed,
      totalOverdue,
      totalReturned,
      totalCancelled,
      users: {
        total: totalUsers,
        admin: adminCount,
        librarian: librarianCount,
        reader: readerCount,
      },
      booksByCategory,
      recentBorrows,
      monthlyBorrows: {
        labels: monthlyLabels,
        data: monthlyData
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};

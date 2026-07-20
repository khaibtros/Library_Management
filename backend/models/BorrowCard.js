const mongoose = require('mongoose');

const borrowedBookSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  }
}, { _id: false });

const borrowCardSchema = new mongoose.Schema({
  reader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrowedBooks: [borrowedBookSchema],
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  borrowDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  returnDate: {
    type: Date,
  },
  // So lan da gia han (toi da MAX_RENEWAL_COUNT = 2, xem borrowController.js)
  renewCount: {
    type: Number,
    default: 0,
  },
  // So ngay tra tre, tinh khi returnBook() neu returnDate > dueDate
  lateDays: {
    type: Number,
    default: 0,
  },
  // Tien phat tre han (VND) = lateDays * FINE_PER_LATE_DAY
  fine: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    // pending: cho duyet | approved: da duyet (chuyen thang sang
    // borrowing khi tru kho) | borrowing: dang muon | returned: da tra |
    // rejected: bi tu choi. 'overdue' KHONG luu trong DB, duoc tinh dong
    // (status='borrowing' && dueDate qua han) de hien badge, tranh can cron
    // job cap nhat dinh ky.
    enum: ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
    default: 'borrowing',
  }
}, { timestamps: true });

const BorrowCard = mongoose.model('BorrowCard', borrowCardSchema, 'borrow_cards');
module.exports = BorrowCard;

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
  // Doc gia bam "Gui yeu cau tra" -> true. Admin/Librarian xac nhan tra
  // xong se dat lai ve false va chuyen status sang 'returned'.
  returnRequested: {
    type: Boolean,
    default: false,
  },
  // Doc gia bam "Gui yeu cau gia han" -> true, kem han moi de xuat.
  // Admin/Librarian duyet se ap dung requestedDueDate vao dueDate.
  renewalRequested: {
    type: Boolean,
    default: false,
  },
  requestedDueDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'borrowed', 'returned', 'overdue', 'cancelled'],
    default: 'borrowed',
  }
}, { timestamps: true });

const BorrowCard = mongoose.model('BorrowCard', borrowCardSchema, 'borrow_cards');
module.exports = BorrowCard;

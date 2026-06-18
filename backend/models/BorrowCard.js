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
  status: {
    type: String,
    enum: ['pending', 'borrowed', 'returned', 'overdue', 'cancelled'],
    default: 'borrowed',
  }
}, { timestamps: true });

const BorrowCard = mongoose.model('BorrowCard', borrowCardSchema, 'borrow_cards');
module.exports = BorrowCard;

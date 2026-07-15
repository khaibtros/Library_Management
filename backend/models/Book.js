const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true
  },
  publishedYear: {
    type: Number
  },
  category: {
    type: String
  },
  totalQuantity: {
    type: Number,
    required: true,
    default: 1
  },
  availableQuantity: {
    type: Number,
    required: true,
    default: 1
  },
  stockAdjustments: [{
    quantityChange: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adjustedAt: { type: Date, default: Date.now },
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);

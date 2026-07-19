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
  publisher: {
    type: String,
    trim: true,
  },
  publishedYear: {
    type: Number
  },
  category: {
    type: String
  },
  description: {
    type: String,
    trim: true,
  },
  // Vi tri ke sach trong thu vien (vd: "Ke A1 - Tang 2")
  shelfLocation: {
    type: String,
    trim: true,
  },
  // Duong dan/URL anh bia sach
  image: {
    type: String,
    default: null,
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Book', bookSchema);

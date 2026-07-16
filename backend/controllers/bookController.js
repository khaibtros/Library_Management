const Book = require('../models/Book');
const BorrowCard = require('../models/BorrowCard');

// Get all books
const getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single book by ID
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new book
const createBook = async (req, res) => {
  if (Object.prototype.hasOwnProperty.call(req.body, 'availableQuantity')) return res.status(400).json({ message: 'availableQuantity do hệ thống quản lý khi tạo sách' });
  const { title, author, isbn, publishedYear, category, totalQuantity } = req.body;
  const book = new Book({
    title,
    author,
    isbn,
    publishedYear,
    category,
    totalQuantity,
    availableQuantity: totalQuantity
  });

  try {
    const newBook = await book.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a book
const updateBook = async (req, res) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, 'availableQuantity') || Object.prototype.hasOwnProperty.call(req.body, 'stockAdjustments')) return res.status(400).json({ message: 'Tồn kho chỉ được thay đổi qua thao tác điều chỉnh tồn' });
    const metadata = req.body;
    const currentBook = await Book.findById(req.params.id);
    if (!currentBook) return res.status(404).json({ message: 'Book not found' });
    if (metadata.totalQuantity !== undefined && Number(metadata.totalQuantity) < currentBook.availableQuantity) return res.status(400).json({ message: 'Tổng số lượng không thể thấp hơn số lượng hiện có' });
    const book = await Book.findByIdAndUpdate(req.params.id, metadata, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const quantityChange = Number(req.body.quantityChange);
    const reason = req.body.reason?.trim();
    if (!Number.isInteger(quantityChange) || quantityChange === 0 || !reason) return res.status(400).json({ message: 'quantityChange là số nguyên khác 0 và reason là bắt buộc' });
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, availableQuantity: { $gte: Math.max(0, -quantityChange) } },
      { $inc: { availableQuantity: quantityChange, totalQuantity: quantityChange }, $push: { stockAdjustments: { quantityChange, reason, adjustedBy: req.user._id } } },
      { new: true, runValidators: true },
    );
    if (!book || book.totalQuantity < 0) return res.status(400).json({ message: 'Điều chỉnh làm tồn kho không hợp lệ' });
    return res.json(book);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
    const cardHistory = await BorrowCard.exists({ 'borrowedBooks.book': req.params.id });
    if (cardHistory) return res.status(400).json({ message: 'Không thể xóa sách đã có lịch sử mượn' });
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  adjustStock,
};

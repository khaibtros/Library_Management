const Book = require('../models/Book');
const BorrowCard = require('../models/BorrowCard');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Return a paginated result when filters are supplied, while preserving the
// original array response for existing consumers that request every book.
const getBooks = async (req, res) => {
  try {
    const { title, author, isbn, category, stock, page, limit } = req.query;
    const hasFilters = [title, author, isbn, category, stock, page, limit].some((value) => value !== undefined);

    if (!hasFilters) return res.status(200).json(await Book.find());

    const query = {};
    if (title?.trim()) query.title = { $regex: escapeRegExp(title.trim()), $options: 'i' };
    if (author?.trim()) query.author = { $regex: escapeRegExp(author.trim()), $options: 'i' };
    if (isbn?.trim()) query.isbn = { $regex: escapeRegExp(isbn.trim()), $options: 'i' };
    if (category?.trim()) query.category = { $regex: escapeRegExp(category.trim()), $options: 'i' };
    if (stock === 'low') query.availableQuantity = { $gt: 0, $lte: 2 };
    if (stock === 'out') query.availableQuantity = 0;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const [count, data] = await Promise.all([
      Book.countDocuments(query),
      Book.find(query).sort({ title: 1 }).skip((pageNumber - 1) * pageSize).limit(pageSize),
    ]);

    return res.status(200).json({ count, page: pageNumber, totalPages: Math.ceil(count / pageSize), data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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

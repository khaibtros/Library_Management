const Book = require('../models/Book');

// Get all books (ho tro tim kiem qua query params: ?title=...&author=...&q=...)
// - q: tim theo ca title lan author (khong phan biet hoa/thuong)
// - title: chi tim theo ten sach
// - author: chi tim theo tac gia
const getBooks = async (req, res) => {
  try {
    const { title, author, q } = req.query;
    const filter = {};

    if (q) {
      const regex = { $regex: q, $options: 'i' };
      filter.$or = [{ title: regex }, { author: regex }];
    } else {
      if (title) filter.title = { $regex: title, $options: 'i' };
      if (author) filter.author = { $regex: author, $options: 'i' };
    }

    const books = await Book.find(filter).sort({ title: 1 });
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
  const { title, author, isbn, publishedYear, category, totalQuantity, availableQuantity } = req.body;
  const book = new Book({
    title,
    author,
    isbn,
    publishedYear,
    category,
    totalQuantity,
    availableQuantity
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
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a book
const deleteBook = async (req, res) => {
  try {
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
  deleteBook
};

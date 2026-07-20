const Book = require('../models/Book');

// Get all books - ho tro pagination, search, sort
// Query: ?page=1&limit=10&keyword=java&category=IT&author=Nguyen&sort=title
// (giu tuong thich nguoc voi ?q=, ?title=, ?author= cua phien ban truoc)
const getBooks = async (req, res) => {
  try {
    const { keyword, q, title, author, category, sort } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

    const filter = {};
    const term = keyword || q;
    if (term) {
      const regex = { $regex: term, $options: 'i' };
      filter.$or = [
        { title: regex },
        { author: regex },
        { isbn: regex },
        { publisher: regex },
      ];
    } else {
      if (title) filter.title = { $regex: title, $options: 'i' };
      if (author) filter.author = { $regex: author, $options: 'i' };
    }
    if (category) filter.category = { $regex: `^${category}$`, $options: 'i' };

    const sortableFields = ['title', 'author', 'publishedYear', 'availableQuantity', 'createdAt'];
    let sortBy = { title: 1 };
    if (sort) {
      const direction = sort.startsWith('-') ? -1 : 1;
      const field = sort.replace('-', '');
      if (sortableFields.includes(field)) sortBy = { [field]: direction };
    }

    const total = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: books,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
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
  const {
    title, author, isbn, publisher, publishedYear, category,
    description, shelfLocation, image, totalQuantity, availableQuantity,
  } = req.body;
  const book = new Book({
    title,
    author,
    isbn,
    publisher,
    publishedYear,
    category,
    description,
    shelfLocation,
    image,
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

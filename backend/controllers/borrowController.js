const BorrowCard = require('../models/BorrowCard');
const Book = require('../models/Book');

const getBorrowCards = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'reader') {
      query.reader = req.user._id; 
    }
    const borrowCards = await BorrowCard.find(query)
      .populate('reader', 'name email libraryCardId')
      .populate('borrowedBooks.book', 'title author isbn')
      .populate('processedBy', 'name email');

    return res.status(200).json({
      success: true,
      count: borrowCards.length,
      data: borrowCards
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thẻ mượn sách',
      error: error.message
    });
  }
};

const getBorrowCardById = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id)
      .populate('reader', 'name email')
      .populate('processedBy', 'name email')
      .populate('borrowedBooks.book', 'title author isbn');
    if (!card) return res.status(404).json({ message: 'Borrow card not found' });

    if (req.user.role === 'reader' && card.reader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to view this borrow card' });
    }

    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustBookQuantities = async (borrowedBooks, deltaSign = 1) => {
  for (const item of borrowedBooks) {
    const book = await Book.findById(item.book);
    if (!book) throw new Error(`Book not found: ${item.book}`);
    const newAvailable = book.availableQuantity - (deltaSign * item.quantity);
    if (newAvailable < 0) throw new Error(`Not enough available copies for book ${book.title}`);
    book.availableQuantity = newAvailable;
    await book.save();
  }
};

const createBorrowCard = async (req, res) => {
  try {
    const { reader, borrowedBooks, borrowDate, dueDate, status } = req.body;

    if (!reader || !borrowedBooks || !Array.isArray(borrowedBooks) || borrowedBooks.length === 0) {
      return res.status(400).json({ message: 'Reader and borrowedBooks are required' });
    }

    try {
      await adjustBookQuantities(borrowedBooks, 1);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const card = new BorrowCard({
      reader,
      borrowedBooks,
      processedBy: req.user && req.user._id,
      borrowDate: borrowDate || Date.now(),
      dueDate,
      status: status || 'borrowed',
    });

    const newCard = await card.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBorrowCard = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Borrow card not found' });

    const { borrowedBooks } = req.body;

    if (borrowedBooks && Array.isArray(borrowedBooks)) {
      for (const item of card.borrowedBooks) {
        const book = await Book.findById(item.book);
        if (book) {
          book.availableQuantity += item.quantity;
          await book.save();
        }
      }

      try {
        await adjustBookQuantities(borrowedBooks, 1);
      } catch (err) {
        for (const item of card.borrowedBooks) {
          const book = await Book.findById(item.book);
          if (book) {
            book.availableQuantity -= item.quantity;
            await book.save();
          }
        }
        return res.status(400).json({ message: err.message });
      }

      card.borrowedBooks = borrowedBooks;
    }

    if (req.body.reader) card.reader = req.body.reader;
    if (req.body.processedBy) card.processedBy = req.body.processedBy;
    if (req.body.borrowDate) card.borrowDate = req.body.borrowDate;
    if (req.body.dueDate) card.dueDate = req.body.dueDate;
    if (req.body.returnDate) card.returnDate = req.body.returnDate;
    if (req.body.status) card.status = req.body.status;

    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteBorrowCard = async (req, res) => {
  try {
    const card = await BorrowCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ message: 'Borrow card not found' });

    for (const item of card.borrowedBooks) {
      const book = await Book.findById(item.book);
      if (book) {
        book.availableQuantity += item.quantity;
        await book.save();
      }
    }

    res.status(200).json({ message: 'Borrow card deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBorrowCards,
  getBorrowCardById,
  createBorrowCard,
  updateBorrowCard,
  deleteBorrowCard,
};

const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Define routes for /api/books
router.route('/')
  .get(getBooks)
  .post(protect, authorize('admin', 'librarian'), createBook);

router.route('/:id')
  .get(getBookById)
  .put(protect, authorize('admin', 'librarian'), updateBook)
  .delete(protect, authorize('admin', 'librarian'), deleteBook);

module.exports = router;

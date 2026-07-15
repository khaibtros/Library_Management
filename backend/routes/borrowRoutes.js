const express = require('express');
const router = express.Router();
const {
  getBorrowCards,
  getBorrowCardById,
  createBorrowCard,
  updateBorrowCard,
  deleteBorrowCard,
  returnBorrowCard,
  renewBorrowCard,
  cancelBorrowCard,
  getOverdueCards,
  refreshOverdueCards,
} = require('../controllers/borrowController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// /api/borrow-cards
// GET: any authenticated user (reader/admin/librarian)
// POST/PUT/DELETE: admin/librarian only
router.patch('/refresh-overdue', protect, authorize('admin', 'librarian'), refreshOverdueCards);
router.get('/overdue', protect, authorize('admin', 'librarian'), getOverdueCards);
router.patch('/:id/return', protect, authorize('admin', 'librarian'), returnBorrowCard);
router.patch('/:id/renew', protect, authorize('admin', 'librarian'), renewBorrowCard);
router.patch('/:id/cancel', protect, authorize('admin', 'librarian'), cancelBorrowCard);

router.route('/')
  .get(protect, getBorrowCards)
  .post(protect, authorize('admin', 'librarian'), createBorrowCard);

router.route('/:id')
  .get(protect, getBorrowCardById)
  .put(protect, authorize('admin', 'librarian'), updateBorrowCard)
  .delete(protect, authorize('admin', 'librarian'), deleteBorrowCard);

module.exports = router;

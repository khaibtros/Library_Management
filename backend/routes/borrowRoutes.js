const express = require('express');
const router = express.Router();
const {
  getBorrowCards,
  getMyHistory,
  getBorrowCardById,
  createBorrowCard,
  updateBorrowCard,
  deleteBorrowCard,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  returnBook,
  renewBook,
} = require('../controllers/borrowController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// /api/borrow-cards
// GET: any authenticated user (reader/admin/librarian)
// POST/PUT/DELETE: admin/librarian only
router.route('/')
  .get(protect, getBorrowCards)
  .post(protect, authorize('admin', 'librarian'), createBorrowCard);

// Doc gia gui yeu cau muon sach (tao phieu 'pending', chua tru so luong)
router.post('/request', protect, createBorrowRequest);

// Lich su muon cua chinh minh (filter status/khoang ngay + phan trang)
router.get('/my-history', protect, getMyHistory);

router.route('/:id')
  .get(protect, getBorrowCardById)
  .put(protect, authorize('admin', 'librarian'), updateBorrowCard)
  .delete(protect, authorize('admin', 'librarian'), deleteBorrowCard);

// Duyet / tu choi yeu cau muon sach (chi admin/librarian)
router.put('/:id/approve', protect, authorize('admin', 'librarian'), approveBorrowRequest);
router.put('/:id/reject', protect, authorize('admin', 'librarian'), rejectBorrowRequest);

// Tra sach & gia han: tu doc gia (chu phieu) hoac admin/librarian,
// KHONG can duyet - xem borrowController.returnBook/renewBook
router.put('/:id/return', protect, returnBook);
router.put('/:id/renew', protect, renewBook);

module.exports = router;

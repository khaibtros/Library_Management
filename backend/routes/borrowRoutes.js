const express = require('express');
const router = express.Router();
const {
  getBorrowCards,
  getBorrowCardById,
  createBorrowCard,
  updateBorrowCard,
  deleteBorrowCard,
  createBorrowRequest,
  approveBorrowRequest,
  rejectBorrowRequest,
  requestReturn,
  confirmReturn,
  requestRenewal,
  approveRenewal,
  rejectRenewal,
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

router.route('/:id')
  .get(protect, getBorrowCardById)
  .put(protect, authorize('admin', 'librarian'), updateBorrowCard)
  .delete(protect, authorize('admin', 'librarian'), deleteBorrowCard);

// Duyet / tu choi yeu cau muon sach (chi admin/librarian)
router.put('/:id/approve', protect, authorize('admin', 'librarian'), approveBorrowRequest);
router.put('/:id/reject', protect, authorize('admin', 'librarian'), rejectBorrowRequest);

// Gui yeu cau tra sach (chu phieu hoac admin/librarian) & xac nhan da tra (admin/librarian)
router.put('/:id/request-return', protect, requestReturn);
router.put('/:id/confirm-return', protect, authorize('admin', 'librarian'), confirmReturn);

// Gui yeu cau gia han (chu phieu hoac admin/librarian) & duyet/tu choi (admin/librarian)
router.put('/:id/request-renewal', protect, requestRenewal);
router.put('/:id/approve-renewal', protect, authorize('admin', 'librarian'), approveRenewal);
router.put('/:id/reject-renewal', protect, authorize('admin', 'librarian'), rejectRenewal);

module.exports = router;

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

// @desc    Doc gia gui yeu cau muon sach (tao phieu voi status 'pending')
// @route   POST /api/borrow-cards/request
// @access  Private (moi role da dang nhap, thuong la reader)
// Luu y: KHONG tru so luong sach ngay, chi tru khi admin/librarian duyet
// (approveBorrowRequest), tranh giu cho "ao" khi yeu cau bi tu choi.
const createBorrowRequest = async (req, res) => {
  try {
    const { borrowedBooks, dueDate } = req.body;

    if (!borrowedBooks || !Array.isArray(borrowedBooks) || borrowedBooks.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một sách để mượn' });
    }

    for (const item of borrowedBooks) {
      const book = await Book.findById(item.book);
      if (!book) return res.status(404).json({ message: `Không tìm thấy sách: ${item.book}` });
      if (book.availableQuantity < item.quantity) {
        return res.status(400).json({ message: `Sách "${book.title}" không đủ số lượng còn sẵn` });
      }
    }

    const card = new BorrowCard({
      reader: req.user._id,
      borrowedBooks,
      status: 'pending',
      dueDate: dueDate || undefined,
    });

    const newCard = await card.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Duyet yeu cau muon sach: pending -> borrowed, tru so luong sach
// @route   PUT /api/borrow-cards/:id/approve
// @access  Private/Admin,Librarian
const approveBorrowRequest = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (card.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể duyệt phiếu đang ở trạng thái chờ duyệt' });
    }

    try {
      await adjustBookQuantities(card.borrowedBooks, 1);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    card.status = 'borrowed';
    card.borrowDate = card.borrowDate || Date.now();
    card.dueDate = req.body.dueDate || card.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    card.processedBy = req.user._id;

    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Tu choi yeu cau muon sach: pending -> cancelled (khong tru sach vi chua tung tru)
// @route   PUT /api/borrow-cards/:id/reject
// @access  Private/Admin,Librarian
const rejectBorrowRequest = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (card.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối phiếu đang ở trạng thái chờ duyệt' });
    }

    card.status = 'cancelled';
    card.processedBy = req.user._id;
    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const ensureOwnerIfReader = (req, card) => {
  if (req.user.role === 'reader' && card.reader.toString() !== req.user._id.toString()) {
    return false;
  }
  return true;
};

// @desc    Doc gia gui yeu cau tra sach cho mot phieu dang muon
// @route   PUT /api/borrow-cards/:id/request-return
// @access  Private (chu phieu, hoac admin/librarian)
const requestReturn = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!ensureOwnerIfReader(req, card)) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác trên phiếu mượn này' });
    }
    if (card.status !== 'borrowed') {
      return res.status(400).json({ message: 'Chỉ có thể gửi yêu cầu trả với phiếu đang mượn' });
    }

    card.returnRequested = true;
    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Admin/Librarian xac nhan da tra sach: borrowed -> returned, hoan lai so luong
// @route   PUT /api/borrow-cards/:id/confirm-return
// @access  Private/Admin,Librarian
const confirmReturn = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (card.status !== 'borrowed') {
      return res.status(400).json({ message: 'Chỉ có thể xác nhận trả với phiếu đang mượn' });
    }

    await adjustBookQuantities(card.borrowedBooks, -1);

    card.status = 'returned';
    card.returnDate = Date.now();
    card.returnRequested = false;
    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Doc gia gui yeu cau gia han han tra
// @route   PUT /api/borrow-cards/:id/request-renewal
// @access  Private (chu phieu, hoac admin/librarian)
const requestRenewal = async (req, res) => {
  try {
    const { requestedDueDate } = req.body;
    if (!requestedDueDate) {
      return res.status(400).json({ message: 'Vui lòng chọn hạn trả mới muốn đề xuất' });
    }

    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!ensureOwnerIfReader(req, card)) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác trên phiếu mượn này' });
    }
    if (card.status !== 'borrowed') {
      return res.status(400).json({ message: 'Chỉ có thể gia hạn phiếu đang mượn' });
    }

    const newDue = new Date(requestedDueDate);
    const currentDue = card.dueDate ? new Date(card.dueDate) : new Date();
    if (Number.isNaN(newDue.getTime()) || newDue <= currentDue) {
      return res.status(400).json({ message: 'Hạn trả mới phải muộn hơn hạn trả hiện tại' });
    }

    card.renewalRequested = true;
    card.requestedDueDate = newDue;
    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Admin/Librarian duyet gia han: ap dung requestedDueDate vao dueDate
// @route   PUT /api/borrow-cards/:id/approve-renewal
// @access  Private/Admin,Librarian
const approveRenewal = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!card.renewalRequested) {
      return res.status(400).json({ message: 'Phiếu này không có yêu cầu gia hạn đang chờ' });
    }

    card.dueDate = card.requestedDueDate;
    card.renewalRequested = false;
    card.requestedDueDate = undefined;
    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Admin/Librarian tu choi gia han
// @route   PUT /api/borrow-cards/:id/reject-renewal
// @access  Private/Admin,Librarian
const rejectRenewal = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!card.renewalRequested) {
      return res.status(400).json({ message: 'Phiếu này không có yêu cầu gia hạn đang chờ' });
    }

    card.renewalRequested = false;
    card.requestedDueDate = undefined;
    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};

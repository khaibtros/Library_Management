const BorrowCard = require('../models/BorrowCard');
const Book = require('../models/Book');

// Muc phat moi ngay tre han (VND). Dac ta khong neu ro so tien, dat mac
// dinh o day, de sua neu can.
const FINE_PER_LATE_DAY = 5000;
// So sach toi da mot doc gia duoc mo cung luc (dang pending/borrowing)
const MAX_ACTIVE_BORROWS = 5;
// So lan gia han toi da cho mot phieu muon
const MAX_RENEWAL_COUNT = 2;
const RENEWAL_EXTRA_DAYS = 7;
const DEFAULT_LOAN_DAYS = 14;

const ACTIVE_STATUSES = ['pending', 'approved', 'borrowing'];

const getBorrowCards = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'reader') {
      query.reader = req.user._id; 
    }
    const borrowCards = await BorrowCard.find(query)
      .populate('reader', 'name email libraryCardId')
      .populate('borrowedBooks.book', 'title author isbn image')
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

// @desc    Lich su muon sach cua chinh minh, co filter status/khoang ngay + phan trang
// @route   GET /api/borrow-cards/my-history
// @access  Private
// Luu y: dac ta ghi duong dan la GET /borrow/my-history; du an nay dat toan
// bo tai nguyen phieu muon duoi tien to /api/borrow-cards de dong bo voi
// cac route con lai, nen dung /api/borrow-cards/my-history.
const getMyHistory = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

    const query = { reader: req.user._id };
    if (status) query.status = status;
    if (from || to) {
      query.borrowDate = {};
      if (from) query.borrowDate.$gte = new Date(from);
      if (to) query.borrowDate.$lte = new Date(to);
    }

    const total = await BorrowCard.countDocuments(query);
    const cards = await BorrowCard.find(query)
      .populate('borrowedBooks.book', 'title author isbn image')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: cards,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBorrowCardById = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id)
      .populate('reader', 'name email')
      .populate('processedBy', 'name email')
      .populate('borrowedBooks.book', 'title author isbn image');
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
      status: status || 'borrowing',
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

// @desc    User nhan "Muon sach" -> tao Borrow status 'pending'. Admin duyet sau.
// @route   POST /api/borrow-cards/request
// @access  Private (reader)
// Validate theo dac ta:
// - 401: khong dang nhap (da xu ly o middleware protect)
// - 403: user bi block (da xu ly o middleware protect)
// - 400: sach het / da muon sach nay chua tra / dang co >=5 sach
// KHONG tru so luong sach ngay, chi tru khi duoc duyet (approveBorrowRequest).
const createBorrowRequest = async (req, res) => {
  try {
    const { borrowedBooks, dueDate } = req.body;

    if (!borrowedBooks || !Array.isArray(borrowedBooks) || borrowedBooks.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn ít nhất một sách để mượn' });
    }

    // Kiem tra ton kho
    for (const item of borrowedBooks) {
      const book = await Book.findById(item.book);
      if (!book) return res.status(404).json({ message: `Không tìm thấy sách: ${item.book}` });
      if (book.availableQuantity < item.quantity) {
        return res.status(400).json({ message: `Sách "${book.title}" hiện đã hết, không thể mượn` });
      }
    }

    // Lay cac phieu dang active (pending/approved/borrowing) cua doc gia nay
    const activeCards = await BorrowCard.find({
      reader: req.user._id,
      status: { $in: ACTIVE_STATUSES },
    });

    // Khong cho muon cung 1 cuon neu chua tra
    const requestedBookIds = borrowedBooks.map((item) => String(item.book));
    const alreadyBorrowedIds = new Set(
      activeCards.flatMap((card) => card.borrowedBooks.map((item) => String(item.book))),
    );
    const duplicate = requestedBookIds.find((bookId) => alreadyBorrowedIds.has(bookId));
    if (duplicate) {
      return res.status(400).json({ message: 'Bạn đã mượn sách này và chưa trả' });
    }

    // Gioi han toi da MAX_ACTIVE_BORROWS sach dang muon/cho duyet cung luc
    const activeQuantity = activeCards.reduce(
      (sum, card) => sum + card.borrowedBooks.reduce((s, item) => s + item.quantity, 0),
      0,
    );
    if (activeQuantity >= MAX_ACTIVE_BORROWS) {
      return res.status(400).json({
        message: `Bạn đang mượn/chờ duyệt ${activeQuantity} sách, đã đạt giới hạn tối đa ${MAX_ACTIVE_BORROWS} sách`,
      });
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

// @desc    Duyet yeu cau muon sach: pending -> borrowing (da duyet + da giao sach), tru so luong sach
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

    card.status = 'borrowing';
    card.borrowDate = card.borrowDate || Date.now();
    card.dueDate = req.body.dueDate || card.dueDate || new Date(Date.now() + DEFAULT_LOAN_DAYS * 24 * 60 * 60 * 1000);
    card.processedBy = req.user._id;

    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Tu choi yeu cau muon sach: pending -> rejected (khong tru sach vi chua tung tru)
// @route   PUT /api/borrow-cards/:id/reject
// @access  Private/Admin,Librarian
const rejectBorrowRequest = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (card.status !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể từ chối phiếu đang ở trạng thái chờ duyệt' });
    }

    card.status = 'rejected';
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

// @desc    Tra sach (tu doc gia, KHONG can admin duyet): borrowing -> returned.
//          Tinh lateDays/fine neu tra tre, hoan lai so luong sach.
// @route   PUT /api/borrow-cards/:id/return
// @access  Private (chu phieu, hoac admin/librarian)
const returnBook = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!ensureOwnerIfReader(req, card)) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác trên phiếu mượn này' });
    }
    if (card.status !== 'borrowing') {
      return res.status(400).json({ message: 'Chỉ có thể trả sách với phiếu đang mượn' });
    }

    await adjustBookQuantities(card.borrowedBooks, -1);

    const returnDate = new Date();
    card.status = 'returned';
    card.returnDate = returnDate;

    if (card.dueDate && returnDate > new Date(card.dueDate)) {
      const lateMs = returnDate.getTime() - new Date(card.dueDate).getTime();
      card.lateDays = Math.ceil(lateMs / (24 * 60 * 60 * 1000));
      card.fine = card.lateDays * FINE_PER_LATE_DAY;
    } else {
      card.lateDays = 0;
      card.fine = 0;
    }

    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Gia han (tu doc gia, KHONG can admin duyet): dueDate += 7 ngay, renewCount++.
//          Dieu kien: status='borrowing', chua qua han, chua gia han qua 2 lan.
// @route   PUT /api/borrow-cards/:id/renew
// @access  Private (chu phieu, hoac admin/librarian)
const renewBook = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!ensureOwnerIfReader(req, card)) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác trên phiếu mượn này' });
    }
    if (card.status !== 'borrowing') {
      return res.status(400).json({ message: 'Chỉ có thể gia hạn phiếu đang mượn' });
    }
    if (card.dueDate && new Date(card.dueDate) < new Date()) {
      return res.status(400).json({ message: 'Phiếu mượn đã quá hạn, không thể gia hạn' });
    }
    if (card.renewCount >= MAX_RENEWAL_COUNT) {
      return res.status(400).json({ message: `Phiếu mượn đã gia hạn tối đa ${MAX_RENEWAL_COUNT} lần` });
    }

    const base = card.dueDate ? new Date(card.dueDate) : new Date();
    card.dueDate = new Date(base.getTime() + RENEWAL_EXTRA_DAYS * 24 * 60 * 60 * 1000);
    card.renewCount += 1;

    const updated = await card.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
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
};

const BorrowCard = require('../models/BorrowCard');
const Book = require('../models/Book');

const activeStatuses = ['borrowed', 'overdue'];
const cardPopulate = (query) => query
  .populate('reader', 'name email')
  .populate('borrowedBooks.book', 'title author isbn')
  .populate('processedBy', 'name email')
  .populate('activityHistory.performedBy', 'name email');

const refreshOverdue = () => BorrowCard.updateMany(
  { status: 'borrowed', dueDate: { $lt: new Date() } },
  { $set: { status: 'overdue' } },
);

const restoreBooks = async (items) => {
  for (const item of items) await Book.findByIdAndUpdate(item.book, { $inc: { availableQuantity: item.quantity } });
};

const reserveBooks = async (items) => {
  const reserved = [];
  try {
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!item.book || !Number.isInteger(quantity) || quantity < 1) throw new Error('Dữ liệu sách mượn không hợp lệ');
      const book = await Book.findOneAndUpdate(
        { _id: item.book, availableQuantity: { $gte: quantity } },
        { $inc: { availableQuantity: -quantity } },
        { new: true },
      );
      if (!book) throw new Error('Sách không tồn tại hoặc không đủ số lượng có sẵn');
      reserved.push({ book: item.book, quantity });
    }
  } catch (error) {
    await restoreBooks(reserved);
    throw error;
  }
};

const validateItems = (items) => Array.isArray(items) && items.length > 0
  && items.every((item) => item.book && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)
  && new Set(items.map((item) => item.book.toString())).size === items.length;

const queryCards = async (req, extra = {}) => {
  await refreshOverdue();
  const { search, status, fromDate, toDate, sort = 'dueDate', page = 1, limit = 10 } = req.query;
  const query = { ...extra };
  if (req.user.role === 'reader') query.reader = req.user._id;
  query.status = extra.status || status || query.status;
  if (fromDate || toDate) query.borrowDate = { ...(fromDate && { $gte: new Date(fromDate) }), ...(toDate && { $lte: new Date(toDate) }) };
  if (search) {
    const pattern = new RegExp(search, 'i');
    const matchedBooks = await Book.find({ $or: [{ title: pattern }, { author: pattern }, { isbn: pattern }] }).select('_id');
    const readerIds = req.user.role === 'reader' ? [req.user._id] : (await require('../models/User').find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id')).map((user) => user._id);
    query.$or = [{ _id: search.match(/^[a-f\d]{24}$/i) ? search : null }, { reader: { $in: readerIds } }, { 'borrowedBooks.book': { $in: matchedBooks.map((book) => book._id) } }].filter((item) => !Object.values(item).includes(null));
  }
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const allowedSorts = { dueDate: { dueDate: 1 }, '-dueDate': { dueDate: -1 }, newest: { createdAt: -1 }, oldest: { createdAt: 1 } };
  const [count, data] = await Promise.all([
    BorrowCard.countDocuments(query),
    cardPopulate(BorrowCard.find(query).sort(allowedSorts[sort] || allowedSorts.dueDate).skip((pageNumber - 1) * pageSize).limit(pageSize)),
  ]);
  return { success: true, count, page: pageNumber, totalPages: Math.ceil(count / pageSize), data };
};

const getBorrowCards = async (req, res) => { try { res.json(await queryCards(req)); } catch (error) { res.status(500).json({ message: error.message }); } };
const getOverdueCards = async (req, res) => { try { res.json(await queryCards(req, { status: 'overdue' })); } catch (error) { res.status(500).json({ message: error.message }); } };
const refreshOverdueCards = async (req, res) => { try { const result = await refreshOverdue(); res.json({ success: true, modifiedCount: result.modifiedCount }); } catch (error) { res.status(500).json({ message: error.message }); } };

const getBorrowCardById = async (req, res) => {
  try {
    await refreshOverdue();
    const card = await cardPopulate(BorrowCard.findById(req.params.id));
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (req.user.role === 'reader' && card.reader._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Không có quyền xem phiếu này' });
    return res.json(card);
  } catch (error) { return res.status(500).json({ message: error.message }); }
};

const createBorrowCard = async (req, res) => {
  try {
    const { reader, borrowedBooks, borrowDate, dueDate } = req.body;
    if (!reader || !validateItems(borrowedBooks)) return res.status(400).json({ message: 'Độc giả và ít nhất một đầu sách hợp lệ là bắt buộc' });
    if (dueDate && new Date(dueDate) < new Date(borrowDate || Date.now())) return res.status(400).json({ message: 'Hạn trả phải sau ngày mượn' });
    await reserveBooks(borrowedBooks);
    const card = await BorrowCard.create({ reader, borrowedBooks, processedBy: req.user._id, borrowDate: borrowDate || Date.now(), dueDate, status: 'borrowed', activityHistory: [{ action: 'created', performedBy: req.user._id }] });
    return res.status(201).json(card);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

const updateBorrowCard = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (card.status !== 'borrowed') return res.status(400).json({ message: 'Chỉ có thể sửa phiếu đang mượn' });
    const { borrowedBooks, borrowDate, dueDate } = req.body;
    if (!validateItems(borrowedBooks)) return res.status(400).json({ message: 'Ít nhất một đầu sách hợp lệ là bắt buộc' });
    if (dueDate && new Date(dueDate) < new Date(borrowDate || card.borrowDate)) return res.status(400).json({ message: 'Hạn trả phải sau ngày mượn' });
    await restoreBooks(card.borrowedBooks);
    try { await reserveBooks(borrowedBooks); } catch (error) { await reserveBooks(card.borrowedBooks); throw error; }
    card.borrowedBooks = borrowedBooks;
    if (borrowDate) card.borrowDate = borrowDate;
    card.dueDate = dueDate || undefined;
    card.activityHistory.push({ action: 'updated', performedBy: req.user._id });
    return res.json(await card.save());
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

const transitionCard = async (req, res, action) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!activeStatuses.includes(card.status)) return res.status(400).json({ message: 'Phiếu này đã kết thúc, không thể thao tác lại' });
    await restoreBooks(card.borrowedBooks);
    card.status = action === 'returned' ? 'returned' : 'cancelled';
    if (action === 'returned') card.returnDate = new Date();
    card.activityHistory.push({ action, performedBy: req.user._id });
    return res.json(await card.save());
  } catch (error) { return res.status(400).json({ message: error.message }); }
};
const returnBorrowCard = (req, res) => transitionCard(req, res, 'returned');
const cancelBorrowCard = (req, res) => transitionCard(req, res, 'cancelled');

const renewBorrowCard = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!activeStatuses.includes(card.status)) return res.status(400).json({ message: 'Chỉ có thể gia hạn phiếu đang hoạt động' });
    const dueDate = new Date(req.body.dueDate);
    if (Number.isNaN(dueDate.getTime()) || dueDate <= new Date(card.dueDate || card.borrowDate)) return res.status(400).json({ message: 'Hạn trả mới phải sau hạn trả hiện tại' });
    const previousDueDate = card.dueDate;
    card.dueDate = dueDate;
    card.status = 'borrowed';
    card.activityHistory.push({ action: 'renewed', performedBy: req.user._id, previousDueDate, newDueDate: dueDate });
    return res.json(await card.save());
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

const deleteBorrowCard = async (req, res) => res.status(405).json({ message: 'Không xóa vĩnh viễn phiếu mượn. Hãy dùng thao tác hủy phiếu.' });

module.exports = { getBorrowCards, getBorrowCardById, createBorrowCard, updateBorrowCard, deleteBorrowCard, returnBorrowCard, renewBorrowCard, cancelBorrowCard, getOverdueCards, refreshOverdueCards };

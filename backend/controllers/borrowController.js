const mongoose = require('mongoose');
const BorrowCard = require('../models/BorrowCard');
const Book = require('../models/Book');

const activeStatuses = ['borrowed', 'overdue'];
const protectedPayloadFields = ['processedBy', 'status', 'returnDate', 'activityHistory'];
const cardPopulate = (query) => query.populate('reader', 'name email').populate('borrowedBooks.book', 'title author isbn').populate('processedBy', 'name email').populate('activityHistory.performedBy', 'name email');
const refreshOverdue = () => BorrowCard.updateMany({ status: 'borrowed', dueDate: { $lt: new Date() } }, { $set: { status: 'overdue' } });

const rejectProtectedFields = (body) => {
  const field = protectedPayloadFields.find((key) => Object.prototype.hasOwnProperty.call(body, key));
  if (field) throw new Error(`Trường ${field} do hệ thống quản lý và không được cập nhật trực tiếp`);
};

const validateItems = (items) => Array.isArray(items) && items.length > 0
  && items.every((item) => item.book && Number.isInteger(Number(item.quantity)) && Number(item.quantity) > 0)
  && new Set(items.map((item) => item.book.toString())).size === items.length;

const itemMap = (items) => new Map(items.map((item) => [item.book.toString(), Number(item.quantity)]));

const applyInventoryDelta = async (oldItems, newItems, session) => {
  const oldMap = itemMap(oldItems); const newMap = itemMap(newItems);
  const ids = new Set([...oldMap.keys(), ...newMap.keys()]);
  const deltas = [...ids].map((id) => ({ id, delta: (newMap.get(id) || 0) - (oldMap.get(id) || 0) }));

  // Hoàn phần giảm trước; nếu phần tăng không đủ tồn, transaction sẽ rollback tất cả.
  for (const { id, delta } of deltas.filter((entry) => entry.delta < 0)) {
    await Book.findByIdAndUpdate(id, { $inc: { availableQuantity: -delta } }, { session });
  }
  for (const { id, delta } of deltas.filter((entry) => entry.delta > 0)) {
    const book = await Book.findOneAndUpdate({ _id: id, availableQuantity: { $gte: delta } }, { $inc: { availableQuantity: -delta } }, { new: true, session });
    if (!book) throw new Error('Sách không tồn tại hoặc không đủ số lượng có sẵn');
  }
};

const withTransaction = async (work) => {
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  const supportsTransactions = topologyType === 'ReplicaSetWithPrimary' || topologyType === 'Sharded';

  // MongoDB standalone không hỗ trợ transaction. Trong môi trường này vẫn chạy
  // tuần tự các thao tác với retryable writes đã tắt ở cấu hình kết nối.
  if (!supportsTransactions) return work(null);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await work(session); });
    return result;
  } finally { await session.endSession(); }
};

const validDate = (value) => value && !Number.isNaN(new Date(value).getTime());
const validateBorrowDates = (borrowDate, dueDate) => {
  if (!validDate(borrowDate)) throw new Error('Ngày mượn không hợp lệ');
  if (dueDate && (!validDate(dueDate) || new Date(dueDate) < new Date(borrowDate))) throw new Error('Hạn trả phải sau hoặc bằng ngày mượn');
};

const queryCards = async (req, extra = {}) => {
  await refreshOverdue();
  const { search, status, fromDate, toDate, sort = 'dueDate', page = 1, limit = 10 } = req.query;
  const query = { ...extra, ...(req.user.role === 'reader' && { reader: req.user._id }) };
  const requestedStatus = extra.status || status;
  if (requestedStatus) query.status = requestedStatus;
  if (fromDate || toDate) query.borrowDate = { ...(fromDate && { $gte: new Date(fromDate) }), ...(toDate && { $lte: new Date(toDate) }) };
  if (search) {
    const pattern = new RegExp(search, 'i');
    const matchedBooks = await Book.find({ $or: [{ title: pattern }, { author: pattern }, { isbn: pattern }] }).select('_id');
    const User = require('../models/User');
    const readerIds = req.user.role === 'reader' ? [req.user._id] : (await User.find({ $or: [{ name: pattern }, { email: pattern }] }).select('_id')).map((user) => user._id);
    query.$or = [{ _id: mongoose.isObjectIdOrHexString(search) ? search : null }, { reader: { $in: readerIds } }, { 'borrowedBooks.book': { $in: matchedBooks.map((book) => book._id) } }].filter((entry) => !Object.values(entry).includes(null));
  }
  const pageNumber = Math.max(1, Number(page) || 1); const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const allowedSorts = { dueDate: { dueDate: 1 }, '-dueDate': { dueDate: -1 }, newest: { createdAt: -1 }, oldest: { createdAt: 1 } };
  const [count, data] = await Promise.all([BorrowCard.countDocuments(query), cardPopulate(BorrowCard.find(query).sort(allowedSorts[sort] || allowedSorts.dueDate).skip((pageNumber - 1) * pageSize).limit(pageSize))]);
  return { success: true, count, page: pageNumber, totalPages: Math.ceil(count / pageSize), data };
};

const getBorrowCards = async (req, res) => { try { return res.json(await queryCards(req)); } catch (error) { return res.status(500).json({ message: error.message }); } };
const getOverdueCards = async (req, res) => { try { return res.json(await queryCards(req, { status: 'overdue' })); } catch (error) { return res.status(500).json({ message: error.message }); } };
const refreshOverdueCards = async (req, res) => { try { const result = await refreshOverdue(); return res.json({ success: true, modifiedCount: result.modifiedCount }); } catch (error) { return res.status(500).json({ message: error.message }); } };

const getBorrowCardById = async (req, res) => {
  try { await refreshOverdue(); const card = await cardPopulate(BorrowCard.findById(req.params.id)); if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' }); if (req.user.role === 'reader' && card.reader._id.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Không có quyền xem phiếu này' }); return res.json(card); }
  catch (error) { return res.status(500).json({ message: error.message }); }
};

const createBorrowCard = async (req, res) => {
  try {
    rejectProtectedFields(req.body);
    const { reader, borrowedBooks, borrowDate = new Date(), dueDate } = req.body;
    if (!reader || !validateItems(borrowedBooks)) return res.status(400).json({ message: 'Độc giả và ít nhất một đầu sách hợp lệ là bắt buộc' });
    validateBorrowDates(borrowDate, dueDate);
    const card = await withTransaction(async (session) => {
      await applyInventoryDelta([], borrowedBooks, session);
      const [created] = await BorrowCard.create([{ reader, borrowedBooks, processedBy: req.user._id, borrowDate, dueDate, status: 'borrowed', activityHistory: [{ action: 'created', performedBy: req.user._id }] }], { session });
      return created;
    });
    return res.status(201).json(card);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

const updateBorrowCard = async (req, res) => {
  try {
    rejectProtectedFields(req.body);
    const { borrowedBooks, borrowDate, dueDate } = req.body;
    if (!validateItems(borrowedBooks)) return res.status(400).json({ message: 'Ít nhất một đầu sách hợp lệ là bắt buộc' });
    const updated = await withTransaction(async (session) => {
      const card = await BorrowCard.findById(req.params.id).session(session);
      if (!card) throw new Error('Không tìm thấy phiếu mượn');
      if (card.status !== 'borrowed') throw new Error('Chỉ có thể sửa phiếu đang mượn');
      validateBorrowDates(borrowDate || card.borrowDate, dueDate);
      await applyInventoryDelta(card.borrowedBooks, borrowedBooks, session);
      card.borrowedBooks = borrowedBooks; if (borrowDate) card.borrowDate = borrowDate; card.dueDate = dueDate || undefined;
      card.activityHistory.push({ action: 'updated', performedBy: req.user._id });
      return card.save({ session });
    });
    return res.json(updated);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};

const transitionCard = async (req, res, action) => {
  try {
    const updated = await withTransaction(async (session) => {
      const card = await BorrowCard.findById(req.params.id).session(session);
      if (!card) throw new Error('Không tìm thấy phiếu mượn');
      if (!activeStatuses.includes(card.status)) throw new Error('Phiếu này đã kết thúc, không thể thao tác lại');
      const returnDate = new Date();
      if (returnDate < new Date(card.borrowDate)) throw new Error('Ngày trả không thể sớm hơn ngày mượn');
      await applyInventoryDelta(card.borrowedBooks, [], session);
      card.status = action === 'returned' ? 'returned' : 'cancelled';
      if (action === 'returned') card.returnDate = returnDate;
      card.activityHistory.push({ action, performedBy: req.user._id });
      return card.save({ session });
    });
    return res.json(updated);
  } catch (error) { return res.status(400).json({ message: error.message }); }
};
const returnBorrowCard = (req, res) => transitionCard(req, res, 'returned');
const cancelBorrowCard = (req, res) => transitionCard(req, res, 'cancelled');

const renewBorrowCard = async (req, res) => {
  try {
    const card = await BorrowCard.findById(req.params.id); if (!card) return res.status(404).json({ message: 'Không tìm thấy phiếu mượn' });
    if (!activeStatuses.includes(card.status)) return res.status(400).json({ message: 'Chỉ có thể gia hạn phiếu đang hoạt động' });
    if (!validDate(req.body.dueDate) || new Date(req.body.dueDate) <= new Date(card.dueDate || card.borrowDate)) return res.status(400).json({ message: 'Hạn trả mới phải sau hạn trả hiện tại' });
    const previousDueDate = card.dueDate; card.dueDate = req.body.dueDate; card.status = 'borrowed'; card.activityHistory.push({ action: 'renewed', performedBy: req.user._id, previousDueDate, newDueDate: card.dueDate });
    return res.json(await card.save());
  } catch (error) { return res.status(400).json({ message: error.message }); }
};
const deleteBorrowCard = async (req, res) => res.status(405).json({ message: 'Không xóa vĩnh viễn phiếu mượn. Hãy dùng thao tác hủy phiếu.' });

module.exports = { getBorrowCards, getBorrowCardById, createBorrowCard, updateBorrowCard, deleteBorrowCard, returnBorrowCard, renewBorrowCard, cancelBorrowCard, getOverdueCards, refreshOverdueCards };

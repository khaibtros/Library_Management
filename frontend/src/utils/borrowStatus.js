export const BORROW_STATUSES = {
  borrowed: { label: 'Đang mượn',  description: 'Sách đang được độc giả mượn' },
  returned: { label: 'Đã trả', description: 'Sách đã được trả lại thư viện' },
  overdue: { label: 'Quá hạn', description: 'Phiếu mượn đã quá hạn trả' },
  cancelled: { label: 'Đã hủy', description: 'Phiếu mượn đã bị hủy' },
};

export const BORROW_STATUS_VALUES = Object.keys(BORROW_STATUSES);

export const BORROW_STATUSES = {
  borrowed: { label: 'Đang mượn', icon: '📖', description: 'Sách đang được độc giả mượn' },
  returned: { label: 'Đã trả', icon: '✓', description: 'Sách đã được trả lại thư viện' },
  overdue: { label: 'Quá hạn', icon: '⏰', description: 'Phiếu mượn đã quá hạn trả' },
  cancelled: { label: 'Đã hủy', icon: '✕', description: 'Phiếu mượn đã bị hủy' },
};

export const BORROW_STATUS_VALUES = Object.keys(BORROW_STATUSES);

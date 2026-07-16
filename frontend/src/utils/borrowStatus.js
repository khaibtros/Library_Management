export const BORROW_STATUSES = {
  pending: { label: 'Chờ duyệt', icon: '⏳', description: 'Yêu cầu mượn đang chờ thủ thư/admin duyệt' },
  borrowed: { label: 'Đang mượn', icon: '📖', description: 'Sách đang được độc giả mượn' },
  returned: { label: 'Đã trả', icon: '✓', description: 'Sách đã được trả lại thư viện' },
  overdue: { label: 'Quá hạn', icon: '⏰', description: 'Phiếu mượn đã quá hạn trả' },
  cancelled: { label: 'Đã hủy', icon: '✕', description: 'Phiếu mượn đã bị hủy' },
};

export const BORROW_STATUS_VALUES = Object.keys(BORROW_STATUSES);

// Dung cho form Tao/Sua phieu (admin/librarian chinh tay): khong cho chon
// 'pending' vi trang thai nay chi nen phat sinh tu luong "Gui yeu cau muon"
// (POST /borrow-cards/request) va duoc duyet/tu choi qua route rieng, tranh
// admin vo tinh chuyen mot phieu da tru sach ve pending gay lech so lieu.
export const MANUAL_BORROW_STATUS_VALUES = BORROW_STATUS_VALUES.filter((status) => status !== 'pending');

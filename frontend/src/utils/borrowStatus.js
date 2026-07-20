export const BORROW_STATUSES = {
  pending: { label: 'Chờ duyệt', icon: '⏳', description: 'Yêu cầu mượn đang chờ thủ thư/admin duyệt' },
  approved: { label: 'Đã duyệt', icon: '✅', description: 'Yêu cầu đã được duyệt' },
  borrowing: { label: 'Đang mượn', icon: '📖', description: 'Sách đang được độc giả mượn' },
  returned: { label: 'Đã trả', icon: '✓', description: 'Sách đã được trả lại thư viện' },
  rejected: { label: 'Đã từ chối', icon: '✕', description: 'Yêu cầu mượn đã bị từ chối' },
  // 'overdue' KHONG phai gia tri status luu trong DB - day la trang thai
  // TINH DONG khi status='borrowing' va dueDate da qua (xem
  // getEffectiveStatus ben duoi), dung rieng de hien badge.
  overdue: { label: 'Quá hạn', icon: '⏰', description: 'Phiếu mượn đã quá hạn trả' },
};

export const BORROW_STATUS_VALUES = Object.keys(BORROW_STATUSES);

// Dung cho form Tao/Sua phieu (admin/librarian chinh tay): khong cho chon
// 'pending'/'overdue' vi:
// - 'pending' chi nen phat sinh tu luong "Gui yeu cau muon" (POST
//   /borrow-cards/request) va duoc duyet/tu choi qua route rieng
// - 'overdue' khong phai gia tri hop le de luu (server se tu choi, vi
//   khong con nam trong enum cua model)
export const MANUAL_BORROW_STATUS_VALUES = BORROW_STATUS_VALUES.filter(
  (status) => status !== 'pending' && status !== 'overdue',
);

// Tra ve status "hien thi": neu phieu dang 'borrowing' va da qua han tra
// (dueDate < hien tai) thi hien 'overdue' thay vi 'borrowing', ma khong
// can luu trang thai nay vao DB (backend cung tinh tuong tu cho thong ke).
export function getEffectiveStatus(card) {
  if (!card) return card;
  if (card.status === 'borrowing' && card.dueDate && new Date(card.dueDate) < new Date()) {
    return 'overdue';
  }
  return card.status;
}

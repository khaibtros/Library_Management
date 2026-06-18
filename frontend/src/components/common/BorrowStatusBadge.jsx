import { BORROW_STATUSES } from '../../utils/borrowStatus';

export default function BorrowStatusBadge({ status }) {
  const config = BORROW_STATUSES[status] || { label: status || 'Không xác định', icon: '?' };

  return (
    <span className={`borrow-status borrow-status-${status || 'unknown'}`}>
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}

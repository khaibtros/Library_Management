import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import BorrowStatusBadge from '../../components/common/BorrowStatusBadge';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { BORROW_STATUS_VALUES, BORROW_STATUSES, getEffectiveStatus } from '../../utils/borrowStatus';

const PAGE_SIZE = 10;
// 'overdue' khong phai gia tri status thuc su luu trong DB nen khong loc
// duoc qua API bang gia tri nay - bo khoi danh sach filter.
const FILTERABLE_STATUSES = BORROW_STATUS_VALUES.filter((status) => status !== 'overdue');

export default function BorrowHistory() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page, limit: PAGE_SIZE };
        if (status) params.status = status;
        if (from) params.from = from;
        if (to) params.to = to;

        const { data } = await API.get('/borrow-cards/my-history', { params });
        if (!active) return;
        setCards(Array.isArray(data?.data) ? data.data : []);
        setTotalPages(data?.totalPages || 1);
        setTotal(data?.total || 0);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải lịch sử mượn.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page, status, from, to]);

  const handleClearFilters = () => {
    setStatus('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasActiveFilter = Boolean(status || from || to);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>📜 Lịch sử mượn</h1>
          <p className="page-subtitle">Toàn bộ các phiếu mượn của bạn, có thể lọc theo trạng thái và khoảng ngày.</p>
        </div>
        <Link to="/borrow-cards" className="btn btn-secondary">← Quay lại Phiếu mượn</Link>
      </div>

      <div className="search-bar">
        <div className="form-group">
          <label htmlFor="status">Trạng thái</label>
          <select id="status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="">Tất cả</option>
            {FILTERABLE_STATUSES.map((value) => (
              <option key={value} value={value}>{BORROW_STATUSES[value].label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="from">Từ ngày</label>
          <input id="from" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
        </div>
        <div className="form-group">
          <label htmlFor="to">Đến ngày</label>
          <input id="to" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
        </div>
        {hasActiveFilter && (
          <div className="search-bar-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Xóa lọc</button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-panel">Đang tải lịch sử mượn...</div>
      ) : cards.length === 0 ? (
        <div className="empty-panel">
          {hasActiveFilter ? 'Không tìm thấy phiếu mượn phù hợp.' : 'Bạn chưa có lịch sử mượn sách nào.'}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Sách mượn</th>
                  <th>Ngày mượn</th>
                  <th>Hạn trả</th>
                  <th>Ngày trả</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => {
                  const firstBook = card.borrowedBooks?.[0]?.book;
                  const extraCount = (card.borrowedBooks?.length || 0) - 1;
                  return (
                    <tr key={card._id}>
                      <td>
                        {firstBook?.image ? (
                          <img src={firstBook.image} alt={firstBook.title} className="book-thumb" />
                        ) : (
                          <div className="book-thumb book-thumb-placeholder">📖</div>
                        )}
                      </td>
                      <td>
                        <div className="cell-primary">{firstBook?.title || 'Sách không còn tồn tại'}</div>
                        {extraCount > 0 && <div className="cell-secondary">và {extraCount} sách khác</div>}
                      </td>
                      <td>{formatDateTime(card.borrowDate)}</td>
                      <td>{formatDateTime(card.dueDate)}</td>
                      <td>{formatDateTime(card.returnDate)}</td>
                      <td><BorrowStatusBadge status={getEffectiveStatus(card)} /></td>
                      <td className="actions">
                        <Link to={`/borrow-cards/${card._id}`} className="btn btn-sm btn-view">Chi tiết</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              ← Trước
            </button>
            <span className="pagination-info">Trang {page}/{totalPages} · {total} phiếu</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Sau →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

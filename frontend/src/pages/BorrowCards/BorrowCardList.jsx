import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import BorrowStatusBadge from '../../components/common/BorrowStatusBadge';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { getEffectiveStatus } from '../../utils/borrowStatus';

export default function BorrowCardList() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const { user } = useAuth();
  // Chi admin/librarian moi duoc tao/sua/xoa phieu muon, khop voi
  // authorize('admin', 'librarian') o backend/routes/borrowRoutes.js
  const canModify = user?.role === 'admin' || user?.role === 'librarian';
  const isReader = user?.role === 'reader';

  const fetchCards = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/borrow-cards');
      setCards(Array.isArray(data?.data) ? data.data : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách phiếu mượn.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await API.get('/borrow-cards');
        if (active) setCards(Array.isArray(data?.data) ? data.data : []);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách phiếu mượn.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleDelete = async (card) => {
    const readerName = card.reader?.name || 'độc giả này';
    if (!window.confirm(`Bạn có chắc muốn xóa phiếu mượn của ${readerName}? Số lượng sách sẽ được hoàn lại.`)) return;

    setDeletingId(card._id);
    setError('');
    try {
      await API.delete(`/borrow-cards/${card._id}`);
      setCards((currentCards) => currentCards.filter((item) => item._id !== card._id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể xóa phiếu mượn.'));
    } finally {
      setDeletingId(null);
    }
  };

  // Doc gia tu tra sach / tu gia han, KHONG can admin duyet
  // (xem backend/controllers/borrowController.js returnBook/renewBook)
  const handleReturn = async (card) => {
    if (!window.confirm('Xác nhận trả sách này? Nếu quá hạn, tiền phạt sẽ được tính tự động.')) return;
    setActionId(card._id);
    setError('');
    try {
      await API.put(`/borrow-cards/${card._id}/return`);
      await fetchCards();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể trả sách.'));
    } finally {
      setActionId(null);
    }
  };

  const handleRenew = async (card) => {
    if (!window.confirm('Gia hạn thêm 7 ngày cho phiếu mượn này?')) return;
    setActionId(card._id);
    setError('');
    try {
      await API.put(`/borrow-cards/${card._id}/renew`);
      await fetchCards();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể gia hạn.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>📋 {isReader ? 'Phiếu mượn của tôi' : 'Phiếu mượn'}</h1>
          <p className="page-subtitle">
            {isReader
              ? 'Danh sách các phiếu mượn sách của bạn.'
              : 'Theo dõi chi tiết việc mượn và trả sách.'}
          </p>
        </div>
        <div className="header-actions">
          {!loading && <span className="result-count">{cards.length} phiếu</span>}
          {isReader && <Link to="/borrow-cards/my-history" className="btn btn-secondary">📜 Lịch sử mượn</Link>}
          {canModify && <Link to="/borrow-cards/new" className="btn btn-primary">+ Tạo phiếu mượn</Link>}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-panel">Đang tải danh sách phiếu mượn...</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Độc giả</th>
                <th>Sách mượn</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const totalQuantity = card.borrowedBooks?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
                const effectiveStatus = getEffectiveStatus(card);
                const isOwner = isReader && card.reader?._id === user?._id;
                return (
                  <tr key={card._id}>
                    <td>
                      <div className="cell-primary">{card.reader?.name || 'Không xác định'}</div>
                      <div className="cell-secondary">{card.reader?.email || '—'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{card.borrowedBooks?.length || 0} đầu sách</div>
                      <div className="cell-secondary">{totalQuantity} cuốn</div>
                    </td>
                    <td>{formatDateTime(card.borrowDate)}</td>
                    <td>{formatDateTime(card.dueDate)}</td>
                    <td><BorrowStatusBadge status={effectiveStatus} /></td>
                    <td className="actions">
                      <Link to={`/borrow-cards/${card._id}`} className="btn btn-sm btn-view">Chi tiết</Link>
                      {isOwner && card.status === 'borrowing' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => handleReturn(card)}
                            disabled={actionId === card._id}
                          >
                            Trả sách
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleRenew(card)}
                            disabled={actionId === card._id || card.renewCount >= 2 || effectiveStatus === 'overdue'}
                          >
                            Gia hạn
                          </button>
                        </>
                      )}
                      {canModify && (
                        <>
                          <Link to={`/borrow-cards/${card._id}/edit`} className="btn btn-sm btn-edit">Sửa</Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-delete"
                            onClick={() => handleDelete(card)}
                            disabled={deletingId === card._id}
                          >
                            {deletingId === card._id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cards.length === 0 && (
                <tr><td colSpan="6" className="empty-cell">Chưa có phiếu mượn nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

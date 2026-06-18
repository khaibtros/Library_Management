import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import BorrowStatusBadge from '../../components/common/BorrowStatusBadge';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';

export default function BorrowCardList() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchCards = async () => {
      try {
        const { data } = await API.get('/borrow-cards');
        if (active) setCards(Array.isArray(data?.data) ? data.data : []);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách phiếu mượn.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCards();
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>📋 Phiếu mượn</h1>
          <p className="page-subtitle">Theo dõi chi tiết việc mượn và trả sách.</p>
        </div>
        {!loading && <span className="result-count">{cards.length} phiếu</span>}
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
                    <td><BorrowStatusBadge status={card.status} /></td>
                    <td className="actions">
                      <Link to={`/borrow-cards/${card._id}`} className="btn btn-sm btn-view">Chi tiết</Link>
                      <Link to={`/borrow-cards/${card._id}/edit`} className="btn btn-sm btn-edit">Sửa</Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(card)}
                        disabled={deletingId === card._id}
                      >
                        {deletingId === card._id ? 'Đang xóa...' : 'Xóa'}
                      </button>
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

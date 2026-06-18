import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import BorrowStatusBadge from '../../components/common/BorrowStatusBadge';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';

export default function BorrowCardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const fetchCard = async () => {
      try {
        const { data } = await API.get(`/borrow-cards/${id}`);
        if (active) setCard(data);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải chi tiết phiếu mượn.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCard();
    return () => { active = false; };
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa phiếu mượn này? Số lượng sách sẽ được hoàn lại.')) return;
    setDeleting(true);
    setError('');
    try {
      await API.delete(`/borrow-cards/${id}`);
      navigate('/borrow-cards');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể xóa phiếu mượn.'));
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading-panel">Đang tải chi tiết phiếu mượn...</div>;

  if (!card) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || 'Không tìm thấy phiếu mượn.'}</div>
        <Link to="/borrow-cards" className="btn btn-secondary">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Chi tiết phiếu mượn</h1>
          <p className="page-subtitle">Mã phiếu: {card._id}</p>
        </div>
        <div className="actions">
          <Link to={`/borrow-cards/${id}/edit`} className="btn btn-edit">Sửa phiếu</Link>
          <button type="button" className="btn btn-delete" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa phiếu'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid">
        <section className="detail-card">
          <h2>Độc giả</h2>
          <dl className="detail-list">
            <div><dt>Họ tên</dt><dd>{card.reader?.name || 'Không xác định'}</dd></div>
            <div><dt>Email</dt><dd>{card.reader?.email || '—'}</dd></div>
            <div><dt>Mã người dùng</dt><dd className="code-value">{card.reader?._id || card.reader || '—'}</dd></div>
          </dl>
        </section>

        <section className="detail-card status-summary">
          <h2>Trạng thái</h2>
          <BorrowStatusBadge status={card.status} />
          <dl className="detail-list compact">
            <div><dt>Người xử lý</dt><dd>{card.processedBy?.name || '—'}</dd></div>
            <div><dt>Email</dt><dd>{card.processedBy?.email || '—'}</dd></div>
          </dl>
        </section>
      </div>

      <section className="detail-card detail-section">
        <h2>Sách đã mượn</h2>
        <div className="table-wrapper flat">
          <table className="table">
            <thead><tr><th>Tiêu đề</th><th>Tác giả</th><th>ISBN</th><th>Số lượng</th></tr></thead>
            <tbody>
              {card.borrowedBooks?.map((item, index) => (
                <tr key={item.book?._id || item.book || index}>
                  <td className="cell-primary">{item.book?.title || 'Sách không còn tồn tại'}</td>
                  <td>{item.book?.author || '—'}</td>
                  <td>{item.book?.isbn || '—'}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-card detail-section">
        <h2>Mốc thời gian</h2>
        <div className="timeline-grid">
          <div><span>Ngày mượn</span><strong>{formatDateTime(card.borrowDate)}</strong></div>
          <div><span>Hạn trả</span><strong>{formatDateTime(card.dueDate)}</strong></div>
          <div><span>Ngày trả</span><strong>{formatDateTime(card.returnDate)}</strong></div>
          <div><span>Ngày tạo</span><strong>{formatDateTime(card.createdAt)}</strong></div>
          <div><span>Cập nhật lần cuối</span><strong>{formatDateTime(card.updatedAt)}</strong></div>
        </div>
      </section>

      <div className="form-actions">
        <Link to="/borrow-cards" className="btn btn-secondary">← Quay lại danh sách</Link>
      </div>
    </div>
  );
}

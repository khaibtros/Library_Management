import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import BorrowStatusBadge from '../../components/common/BorrowStatusBadge';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatDateTime } from '../../utils/date';
import { getEffectiveStatus } from '../../utils/borrowStatus';

const MAX_RENEWAL_COUNT = 2;

export default function BorrowCardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canModify = user?.role === 'admin' || user?.role === 'librarian';
  const isOwner = card?.reader?._id === user?._id;

  const reloadCard = async () => {
    const { data } = await API.get(`/borrow-cards/${id}`);
    setCard(data);
  };

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

  const runAction = async (actionFn, successMessage) => {
    setActionError('');
    setActionMessage('');
    setActionLoading(true);
    try {
      await actionFn();
      await reloadCard();
      setActionMessage(successMessage);
    } catch (requestError) {
      setActionError(getApiErrorMessage(requestError, 'Không thể thực hiện thao tác này.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = () => runAction(
    () => API.put(`/borrow-cards/${id}/approve`),
    'Đã duyệt yêu cầu mượn sách.',
  );

  const handleReject = () => {
    if (!window.confirm('Từ chối yêu cầu mượn sách này?')) return;
    runAction(
      () => API.put(`/borrow-cards/${id}/reject`),
      'Đã từ chối yêu cầu mượn sách.',
    );
  };

  // Tra sach / gia han: TU doc gia thao tac, KHONG can admin duyet
  // (xem backend/controllers/borrowController.js returnBook/renewBook)
  const handleReturn = () => {
    if (!window.confirm('Xác nhận trả sách? Nếu quá hạn, tiền phạt sẽ được tính tự động.')) return;
    runAction(
      () => API.put(`/borrow-cards/${id}/return`),
      'Đã trả sách thành công.',
    );
  };

  const handleRenew = () => {
    if (!window.confirm('Gia hạn thêm 7 ngày cho phiếu mượn này?')) return;
    runAction(
      () => API.put(`/borrow-cards/${id}/renew`),
      'Đã gia hạn thêm 7 ngày.',
    );
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

  const effectiveStatus = getEffectiveStatus(card);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Chi tiết phiếu mượn</h1>
          <p className="page-subtitle">Mã phiếu: {card._id}</p>
        </div>
        <div className="actions">
          {canModify && (
            <>
              <Link to={`/borrow-cards/${id}/edit`} className="btn btn-edit">Sửa phiếu</Link>
              <button type="button" className="btn btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa phiếu'}
              </button>
            </>
          )}
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
          <BorrowStatusBadge status={effectiveStatus} />
          <dl className="detail-list compact">
            <div><dt>Người xử lý</dt><dd>{card.processedBy?.name || '—'}</dd></div>
            <div><dt>Số lần gia hạn</dt><dd>{card.renewCount || 0}/{MAX_RENEWAL_COUNT}</dd></div>
            {card.status === 'returned' && (card.fine > 0 || card.lateDays > 0) && (
              <>
                <div><dt>Số ngày trễ</dt><dd>{card.lateDays || 0} ngày</dd></div>
                <div><dt>Tiền phạt</dt><dd>{(card.fine || 0).toLocaleString('vi-VN')}đ</dd></div>
              </>
            )}
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
        <h2>Hành động</h2>
        {actionError && <div className="alert alert-error">{actionError}</div>}
        {actionMessage && <div className="alert alert-success">{actionMessage}</div>}

        {/* Admin/librarian duyet hoac tu choi yeu cau muon dang cho */}
        {canModify && card.status === 'pending' && (
          <div className="action-group">
            <p>Yêu cầu mượn sách này đang chờ duyệt.</p>
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>
                ✓ Duyệt yêu cầu
              </button>
              <button type="button" className="btn btn-delete" onClick={handleReject} disabled={actionLoading}>
                ✕ Từ chối
              </button>
            </div>
          </div>
        )}

        {/* Chu phieu (hoac admin/librarian): tu tra sach / gia han truc tiep */}
        {(isOwner || canModify) && card.status === 'borrowing' && (
          <div className="action-group">
            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={handleReturn} disabled={actionLoading}>
                📚 Trả sách
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRenew}
                disabled={actionLoading || card.renewCount >= MAX_RENEWAL_COUNT || effectiveStatus === 'overdue'}
              >
                ⏳ Gia hạn (+7 ngày)
              </button>
            </div>
            {effectiveStatus === 'overdue' && (
              <p className="text-muted">Phiếu đã quá hạn trả, không thể gia hạn thêm.</p>
            )}
            {card.renewCount >= MAX_RENEWAL_COUNT && effectiveStatus !== 'overdue' && (
              <p className="text-muted">Đã gia hạn tối đa {MAX_RENEWAL_COUNT} lần.</p>
            )}
          </div>
        )}

        {card.status === 'pending' && !canModify && (
          <p className="text-muted">Yêu cầu mượn sách đang chờ thủ thư/admin duyệt.</p>
        )}
        {card.status === 'returned' && <p className="text-muted">Phiếu mượn này đã hoàn tất, sách đã được trả.</p>}
        {card.status === 'rejected' && <p className="text-muted">Yêu cầu mượn này đã bị từ chối.</p>}
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

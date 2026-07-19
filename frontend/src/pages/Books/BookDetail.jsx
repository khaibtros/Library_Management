import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const isReader = user?.role === 'reader';
  const canModify = user?.role === 'admin' || user?.role === 'librarian';

  useEffect(() => {
    let active = true;
    const fetchBook = async () => {
      try {
        const { data } = await API.get(`/books/${id}`);
        if (active) setBook(data);
      } catch (requestErr) {
        if (active) setError(getApiErrorMessage(requestErr, 'Không thể tải thông tin sách.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBook();
    return () => { active = false; };
  }, [id]);

  const handleBorrowRequest = async (event) => {
    event.preventDefault();
    setRequestError('');
    setRequestSuccess('');

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setRequestError('Số lượng phải là số nguyên từ 1 trở lên.');
      return;
    }
    if (book && qty > book.availableQuantity) {
      setRequestError('Số lượng yêu cầu vượt quá số sách còn sẵn.');
      return;
    }

    setRequesting(true);
    try {
      const { data: createdCard } = await API.post('/borrow-cards/request', {
        borrowedBooks: [{ book: id, quantity: qty }],
      });
      setRequestSuccess('Đã gửi yêu cầu mượn sách! Vui lòng chờ thủ thư/admin duyệt.');
      setTimeout(() => navigate(`/borrow-cards/${createdCard._id}`), 1200);
    } catch (requestErr) {
      setRequestError(getApiErrorMessage(requestErr, 'Không thể gửi yêu cầu mượn sách.'));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="loading-panel">Đang tải thông tin sách...</div>;

  if (!book) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || 'Không tìm thấy sách.'}</div>
        <Link to="/books" className="btn btn-secondary">Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>📖 {book.title}</h1>
          <p className="page-subtitle">Chi tiết thông tin sách trong thư viện.</p>
        </div>
        {canModify && (
          <Link to={`/books/edit/${book._id}`} className="btn btn-edit">Sửa sách</Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="detail-grid book-detail-grid">
        <section className="detail-card book-cover-card">
          {book.image ? (
            <img src={book.image} alt={book.title} className="book-cover-large" />
          ) : (
            <div className="book-cover-large book-cover-placeholder">📖</div>
          )}
        </section>

        <section className="detail-card">
          <h2>Thông tin sách</h2>
          <dl className="detail-list">
            <div><dt>Tác giả</dt><dd>{book.author}</dd></div>
            <div><dt>ISBN</dt><dd className="code-value">{book.isbn}</dd></div>
            <div><dt>Nhà xuất bản</dt><dd>{book.publisher || '—'}</dd></div>
            <div><dt>Thể loại</dt><dd>{book.category || '—'}</dd></div>
            <div><dt>Năm xuất bản</dt><dd>{book.publishedYear || '—'}</dd></div>
            <div><dt>Vị trí kệ</dt><dd>{book.shelfLocation || '—'}</dd></div>
          </dl>
        </section>

        <section className="detail-card status-summary">
          <h2>Số lượng</h2>
          <dl className="detail-list compact">
            <div><dt>Tổng số</dt><dd>{book.totalQuantity}</dd></div>
            <div><dt>Còn sẵn</dt><dd>{book.availableQuantity > 0 ? book.availableQuantity : <span className="badge badge-out-of-stock">Hết sách</span>}</dd></div>
          </dl>
        </section>
      </div>

      {book.description && (
        <section className="detail-card detail-section">
          <h2>Mô tả</h2>
          <p>{book.description}</p>
        </section>
      )}

      {isReader && (
        <section className="detail-card detail-section">
          <h2>Mượn sách</h2>
          {book.availableQuantity < 1 ? (
            <p className="text-muted">Sách hiện đã hết, không thể mượn.</p>
          ) : (
            <form onSubmit={handleBorrowRequest} className="form-row">
              <div className="form-group quantity-field">
                <label htmlFor="quantity">Số lượng muốn mượn</label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={book.availableQuantity}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={requesting}>
                  {requesting ? 'Đang gửi...' : '📚 Mượn sách'}
                </button>
              </div>
            </form>
          )}
          {requestError && <div className="alert alert-error">{requestError}</div>}
          {requestSuccess && <div className="alert alert-success">{requestSuccess}</div>}
        </section>
      )}

      <div className="form-actions">
        <Link to="/books" className="btn btn-secondary">← Quay lại danh sách</Link>
      </div>
    </div>
  );
}

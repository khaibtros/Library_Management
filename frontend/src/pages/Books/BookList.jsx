import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');
  const { user } = useAuth();
  const canModify = user?.role === 'admin' || user?.role === 'librarian';

  useEffect(() => {
    let active = true;
    const fetchBooks = async () => {
      try {
        const { data } = await API.get('/books');
        if (active) setBooks(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách sách.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBooks();
    return () => { active = false; };
  }, []);

  const handleDelete = async (book) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sách “${book.title}”?`)) return;

    setDeletingId(book._id);
    setError('');
    try {
      await API.delete(`/books/${book._id}`);
      setBooks((currentBooks) => currentBooks.filter((item) => item._id !== book._id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể xóa sách.'));
    } finally {
      setDeletingId(null);
    }
  };

  const adjustStock = async (book) => {
    const quantityChange = Number(window.prompt(`Điều chỉnh tồn cho “${book.title}” (dương để nhập, âm để giảm):`));
    if (!Number.isInteger(quantityChange) || quantityChange === 0) return;
    const reason = window.prompt('Lý do điều chỉnh tồn:');
    if (!reason?.trim()) return;
    try { await API.patch(`/books/${book._id}/stock-adjustment`, { quantityChange, reason }); window.location.reload(); }
    catch (requestError) { setError(getApiErrorMessage(requestError, 'Không thể điều chỉnh tồn kho.')); }
  };
  const visibleBooks = books.filter((book) => stockFilter === 'all' || (stockFilter === 'out' ? book.availableQuantity === 0 : book.availableQuantity > 0 && book.availableQuantity <= 2));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>📖 Danh sách sách</h1>
          <p className="page-subtitle">Theo dõi đầu sách và số lượng hiện có trong thư viện.</p>
        </div>
        <div className="header-actions"><select value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="all">Tất cả tồn kho</option><option value="out">Hết sách</option><option value="low">Sắp hết (1–2)</option></select>{canModify && <Link to="/books/new" className="btn btn-primary">+ Thêm sách</Link>}</div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-panel">Đang tải danh sách sách...</div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tác giả</th>
                <th>ISBN</th>
                <th>Thể loại</th>
                <th>Tổng số</th>
                <th>Có sẵn</th>
                {canModify && <th>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {visibleBooks.map((book) => (
                <tr key={book._id}>
                  <td className="cell-primary">{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.isbn}</td>
                  <td>{book.category || '—'}</td>
                  <td>{book.totalQuantity}</td>
                  <td>{book.availableQuantity} {book.availableQuantity === 0 && <span className="borrow-status borrow-status-overdue">Hết</span>}{book.availableQuantity > 0 && book.availableQuantity <= 2 && <span className="borrow-status borrow-status-cancelled">Sắp hết</span>}</td>
                  {canModify && (
                    <td className="actions">
                      <Link to={`/books/edit/${book._id}`} className="btn btn-sm btn-edit">Sửa</Link>
                      <button type="button" onClick={() => adjustStock(book)} className="btn btn-sm btn-secondary">Điều chỉnh tồn</button>
                      <button
                        type="button"
                        onClick={() => handleDelete(book)}
                        className="btn btn-sm btn-delete"
                        disabled={deletingId === book._id}
                      >
                        {deletingId === book._id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {visibleBooks.length === 0 && (
                <tr><td colSpan={canModify ? 7 : 6} className="empty-cell">Chưa có sách nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

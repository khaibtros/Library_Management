/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

const defaultFilters = { title: '', author: '', isbn: '', category: '', stock: 'all' };

export default function BookList() {
  const [result, setResult] = useState({ data: [], count: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const { user } = useAuth();
  const canModify = user?.role === 'admin' || user?.role === 'librarian';

  const loadBooks = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/books', {
        params: {
          ...nextFilters,
          stock: nextFilters.stock === 'all' ? undefined : nextFilters.stock,
          page,
          limit: 10,
        },
      });
      setResult(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách sách.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (book) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sách “${book.title}”?`)) return;

    setDeletingId(book._id);
    setError('');
    try {
      await API.delete(`/books/${book._id}`);
      await loadBooks(result.data.length === 1 && result.page > 1 ? result.page - 1 : result.page);
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
    try {
      await API.patch(`/books/${book._id}/stock-adjustment`, { quantityChange, reason });
      await loadBooks(result.page);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể điều chỉnh tồn kho.'));
    }
  };

  const submitFilters = (event) => {
    event.preventDefault();
    loadBooks(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    loadBooks(1, defaultFilters);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Quản lý Sách</h1>
          <p className="page-subtitle">Theo dõi đầu sách và số lượng hiện có trong thư viện.</p>
        </div>
        <div className="header-actions">
          {canModify && <Link to="/books/new" className="btn btn-primary">+ Thêm sách</Link>}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="filter-bar" onSubmit={submitFilters}>
        <input aria-label="Lọc theo tiêu đề" placeholder="Tiêu đề" value={filters.title} onChange={(event) => setFilters({ ...filters, title: event.target.value })} />
        <input aria-label="Lọc theo tác giả" placeholder="Tác giả" value={filters.author} onChange={(event) => setFilters({ ...filters, author: event.target.value })} />
        <input aria-label="Lọc theo ISBN" placeholder="ISBN" value={filters.isbn} onChange={(event) => setFilters({ ...filters, isbn: event.target.value })} />
        <input aria-label="Lọc theo thể loại" placeholder="Thể loại" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} />
        <select aria-label="Lọc theo tồn kho" value={filters.stock} onChange={(event) => setFilters({ ...filters, stock: event.target.value })}>
          <option value="all">Tất cả tồn kho</option>
          <option value="low">Sắp hết (1–2)</option>
          <option value="out">Hết sách</option>
        </select>
        <button type="submit" className="btn btn-primary">Lọc</button>
        <button type="button" className="btn btn-secondary" onClick={resetFilters}>Xóa lọc</button>
      </form>

      {loading ? (
        <div className="loading-panel">Đang tải danh sách sách...</div>
      ) : (
        <>
          <p className="result-summary">{result.count} sách</p>
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
                {result.data.map((book) => (
                  <tr key={book._id}>
                    <td className="cell-primary">{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.isbn}</td>
                    <td>{book.category || '—'}</td>
                    <td>{book.totalQuantity}</td>
                    <td>
                      {book.availableQuantity}
                      {book.availableQuantity === 0 && <span className="borrow-status borrow-status-overdue">Hết</span>}
                      {book.availableQuantity > 0 && book.availableQuantity <= 2 && <span className="borrow-status borrow-status-cancelled">Sắp hết</span>}
                    </td>
                    {canModify && (
                      <td className="actions">
                        <Link to={`/books/edit/${book._id}`} className="btn btn-sm btn-edit">Sửa</Link>
                        <button type="button" onClick={() => adjustStock(book)} className="btn btn-sm btn-secondary">Điều chỉnh tồn</button>
                        <button type="button" onClick={() => handleDelete(book)} className="btn btn-sm btn-delete" disabled={deletingId === book._id}>
                          {deletingId === book._id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {result.data.length === 0 && (
                  <tr><td colSpan={canModify ? 7 : 6} className="empty-cell">Không tìm thấy sách phù hợp.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button type="button" className="btn btn-secondary btn-sm" disabled={result.page <= 1} onClick={() => loadBooks(result.page - 1)}>← Trước</button>
            <span>Trang {result.page} / {result.totalPages || 1}</span>
            <button type="button" className="btn btn-secondary btn-sm" disabled={result.page >= result.totalPages} onClick={() => loadBooks(result.page + 1)}>Sau →</button>
          </div>
        </>
      )}
    </div>
  );
}

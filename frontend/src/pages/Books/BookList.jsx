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
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const { user } = useAuth();
  const canModify = user?.role === 'admin' || user?.role === 'librarian';

  const fetchBooks = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/books', { params });
      setBooks(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách sách.'));
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
        const { data } = await API.get('/books');
        if (active) setBooks(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách sách.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const params = {};
    if (searchTitle.trim()) params.title = searchTitle.trim();
    if (searchAuthor.trim()) params.author = searchAuthor.trim();
    fetchBooks(params);
  };

  const handleClearSearch = () => {
    setSearchTitle('');
    setSearchAuthor('');
    fetchBooks();
  };

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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>📖 Danh sách sách</h1>
          <p className="page-subtitle">Theo dõi đầu sách và số lượng hiện có trong thư viện.</p>
        </div>
        {canModify && <Link to="/books/new" className="btn btn-primary">+ Thêm sách</Link>}
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <div className="form-group">
          <label htmlFor="searchTitle">Tên sách</label>
          <input
            id="searchTitle"
            placeholder="Nhập tên sách..."
            value={searchTitle}
            onChange={(event) => setSearchTitle(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="searchAuthor">Tác giả</label>
          <input
            id="searchAuthor"
            placeholder="Nhập tên tác giả..."
            value={searchAuthor}
            onChange={(event) => setSearchAuthor(event.target.value)}
          />
        </div>
        <div className="search-bar-actions">
          <button type="submit" className="btn btn-primary">🔍 Tìm kiếm</button>
          <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>Xóa lọc</button>
        </div>
      </form>

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
              {books.map((book) => (
                <tr key={book._id}>
                  <td className="cell-primary">
                    <Link to={`/books/${book._id}`} className="cell-link">{book.title}</Link>
                  </td>
                  <td>{book.author}</td>
                  <td>{book.isbn}</td>
                  <td>{book.category || '—'}</td>
                  <td>{book.totalQuantity}</td>
                  <td>{book.availableQuantity}</td>
                  {canModify && (
                    <td className="actions">
                      <Link to={`/books/edit/${book._id}`} className="btn btn-sm btn-edit">Sửa</Link>
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
              {books.length === 0 && (
                <tr><td colSpan={canModify ? 7 : 6} className="empty-cell">
                  {(searchTitle || searchAuthor) ? 'Không tìm thấy sách phù hợp.' : 'Chưa có sách nào.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

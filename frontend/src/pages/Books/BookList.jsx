import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

const DEBOUNCE_MS = 500;
const PAGE_SIZE = 10;

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [sort, setSort] = useState('title');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const { user } = useAuth();
  const canModify = user?.role === 'admin' || user?.role === 'librarian';
  const isReader = user?.role === 'reader';

  // Debounce 500ms cho o tim kiem realtime (keyword: ten sach/ISBN/tac gia/NXB)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page, limit: PAGE_SIZE, sort };
        if (debouncedKeyword) params.keyword = debouncedKeyword;
        if (category.trim()) params.category = category.trim();
        if (author.trim()) params.author = author.trim();

        const { data } = await API.get('/books', { params });
        if (!active) return;
        setBooks(Array.isArray(data?.data) ? data.data : []);
        setTotalPages(data?.totalPages || 1);
        setTotal(data?.total || 0);
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải danh sách sách.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [page, sort, debouncedKeyword, category, author]);

  const handleDelete = async (book) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sách "${book.title}"?`)) return;

    setDeletingId(book._id);
    setError('');
    try {
      await API.delete(`/books/${book._id}`);
      setBooks((currentBooks) => currentBooks.filter((item) => item._id !== book._id));
      setTotal((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể xóa sách.'));
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilter = useMemo(
    () => Boolean(debouncedKeyword || category.trim() || author.trim()),
    [debouncedKeyword, category, author],
  );

  const handleClearFilters = () => {
    setKeyword('');
    setDebouncedKeyword('');
    setCategory('');
    setAuthor('');
    setPage(1);
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

      <div className="search-bar">
        <div className="form-group">
          <label htmlFor="keyword">Tìm kiếm</label>
          <input
            id="keyword"
            placeholder="Tên sách, ISBN, tác giả, nhà xuất bản..."
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="category">Thể loại</label>
          <input
            id="category"
            placeholder="VD: IT"
            value={category}
            onChange={(event) => { setCategory(event.target.value); setPage(1); }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="author">Tác giả</label>
          <input
            id="author"
            placeholder="VD: Nguyen"
            value={author}
            onChange={(event) => { setAuthor(event.target.value); setPage(1); }}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sort">Sắp xếp</label>
          <select id="sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="title">Tên sách (A-Z)</option>
            <option value="-title">Tên sách (Z-A)</option>
            <option value="author">Tác giả (A-Z)</option>
            <option value="-publishedYear">Năm XB (mới nhất)</option>
            <option value="-availableQuantity">Còn sẵn (nhiều nhất)</option>
          </select>
        </div>
        {hasActiveFilter && (
          <div className="search-bar-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Xóa lọc</button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-panel">Đang tải danh sách sách...</div>
      ) : books.length === 0 ? (
        <div className="empty-panel">
          {hasActiveFilter ? 'Không tìm thấy sách' : 'Chưa có sách nào.'}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên sách</th>
                  <th>Tác giả</th>
                  <th>Thể loại</th>
                  <th>Số lượng còn</th>
                  {isReader && <th>Mượn</th>}
                  {canModify && <th>Hành động</th>}
                </tr>
              </thead>
              <tbody>
                {books.map((book) => {
                  const outOfStock = (book.availableQuantity ?? 0) <= 0;
                  return (
                    <tr key={book._id}>
                      <td>
                        <Link to={`/books/${book._id}`}>
                          {book.image ? (
                            <img src={book.image} alt={book.title} className="book-thumb" />
                          ) : (
                            <div className="book-thumb book-thumb-placeholder">📖</div>
                          )}
                        </Link>
                      </td>
                      <td className="cell-primary">
                        <Link to={`/books/${book._id}`} className="cell-link">{book.title}</Link>
                      </td>
                      <td>{book.author}</td>
                      <td>{book.category || '—'}</td>
                      <td>
                        {outOfStock ? (
                          <span className="badge badge-out-of-stock">Hết sách</span>
                        ) : (
                          `${book.availableQuantity}/${book.totalQuantity}`
                        )}
                      </td>
                      {isReader && (
                        <td>
                          <Link
                            to={`/books/${book._id}`}
                            className={`btn btn-sm ${outOfStock ? 'btn-disabled' : 'btn-primary'}`}
                            aria-disabled={outOfStock}
                            onClick={(event) => { if (outOfStock) event.preventDefault(); }}
                          >
                            Mượn
                          </Link>
                        </td>
                      )}
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
            <span className="pagination-info">Trang {page}/{totalPages} · {total} sách</span>
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

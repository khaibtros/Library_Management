import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const { user } = useAuth();
  const canModify = user?.role === 'admin' || user?.role === 'librarian';

  useEffect(() => {
    const fetch = async () => {
      const { data } = await API.get('/books');
      setBooks(data);
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sách này?')) return;
    await API.delete(`/books/${id}`);
    setBooks(books.filter((b) => b._id !== id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>📖 Danh sách sách</h1>
        {canModify && <Link to="/books/new" className="btn btn-primary">+ Thêm sách</Link>}
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Tác giả</th>
            <th>ISBN</th>
            <th>Thể loại</th>
            <th>Số lượng</th>
            <th>Có sẵn</th>
            {canModify && <th>Hành động</th>}
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book._id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.isbn}</td>
              <td>{book.category}</td>
              <td>{book.totalQuantity}</td>
              <td>{book.availableQuantity}</td>
              {canModify && (
                <td className="actions">
                  <Link to={`/books/edit/${book._id}`} className="btn btn-sm btn-edit">Sửa</Link>
                  <button onClick={() => handleDelete(book._id)} className="btn btn-sm btn-delete">Xóa</button>
                </td>
              )}
            </tr>
          ))}
          {books.length === 0 && (
            <tr><td colSpan={canModify ? 7 : 6} className="text-center">Chưa có sách nào</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

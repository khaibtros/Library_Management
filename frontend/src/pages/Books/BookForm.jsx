import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

export default function BookForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', publishedYear: '',
    category: '', totalQuantity: 1, availableQuantity: 1,
  });

  useEffect(() => {
    if (isEdit) {
      API.get(`/books/${id}`).then(({ data }) => {
        setForm({
          title: data.title, author: data.author, isbn: data.isbn,
          publishedYear: data.publishedYear || '', category: data.category || '',
          totalQuantity: data.totalQuantity, availableQuantity: data.availableQuantity,
        });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEdit) {
      await API.put(`/books/${id}`, form);
    } else {
      await API.post('/books', form);
    }
    navigate('/books');
  };

  return (
    <div className="page">
      <h1>{isEdit ? '✏️ Sửa sách' : '➕ Thêm sách'}</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label>Tiêu đề</label>
            <input name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Tác giả</label>
            <input name="author" value={form.author} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>ISBN</label>
            <input name="isbn" value={form.isbn} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Năm xuất bản</label>
            <input name="publishedYear" type="number" value={form.publishedYear} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Thể loại</label>
            <input name="category" value={form.category} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Tổng số lượng</label>
            <input name="totalQuantity" type="number" min="1" value={form.totalQuantity} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-group">
          <label>Số lượng có sẵn</label>
          <input name="availableQuantity" type="number" min="0" value={form.availableQuantity} onChange={handleChange} required />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{isEdit ? 'Cập nhật' : 'Thêm mới'}</button>
          <button type="button" onClick={() => navigate('/books')} className="btn btn-secondary">Hủy</button>
        </div>
      </form>
    </div>
  );
}

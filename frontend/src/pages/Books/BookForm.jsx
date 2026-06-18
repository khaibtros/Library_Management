import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';

const initialForm = {
  title: '',
  author: '',
  isbn: '',
  publishedYear: '',
  category: '',
  totalQuantity: 1,
  availableQuantity: 1,
};

export default function BookForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    const fetchBook = async () => {
      try {
        const { data } = await API.get(`/books/${id}`);
        if (!active) return;
        setForm({
          title: data.title || '',
          author: data.author || '',
          isbn: data.isbn || '',
          publishedYear: data.publishedYear ?? '',
          category: data.category || '',
          totalQuantity: data.totalQuantity ?? 1,
          availableQuantity: data.availableQuantity ?? 1,
        });
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải thông tin sách.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBook();
    return () => { active = false; };
  }, [id, isEdit]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const totalQuantity = Number(form.totalQuantity);
    const availableQuantity = Number(form.availableQuantity);
    const publishedYear = form.publishedYear === '' ? undefined : Number(form.publishedYear);

    if (!Number.isInteger(totalQuantity) || totalQuantity < 1) {
      setError('Tổng số lượng phải là số nguyên từ 1 trở lên.');
      return;
    }
    if (!Number.isInteger(availableQuantity) || availableQuantity < 0) {
      setError('Số lượng có sẵn phải là số nguyên không âm.');
      return;
    }
    if (availableQuantity > totalQuantity) {
      setError('Số lượng có sẵn không được vượt quá tổng số lượng.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      category: form.category.trim(),
      totalQuantity,
      availableQuantity,
      ...(publishedYear !== undefined && { publishedYear }),
    };

    setSaving(true);
    try {
      if (isEdit) await API.put(`/books/${id}`, payload);
      else await API.post('/books', payload);
      navigate('/books');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Không thể ${isEdit ? 'cập nhật' : 'thêm'} sách.`));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-panel">Đang tải thông tin sách...</div>;

  return (
    <div className="page">
      <h1>{isEdit ? '✏️ Sửa sách' : '➕ Thêm sách'}</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Tiêu đề</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="author">Tác giả</label>
            <input id="author" name="author" value={form.author} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="isbn">ISBN</label>
            <input id="isbn" name="isbn" value={form.isbn} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="publishedYear">Năm xuất bản</label>
            <input id="publishedYear" name="publishedYear" type="number" min="0" value={form.publishedYear} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Thể loại</label>
            <input id="category" name="category" value={form.category} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="totalQuantity">Tổng số lượng</label>
            <input id="totalQuantity" name="totalQuantity" type="number" min="1" step="1" value={form.totalQuantity} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="availableQuantity">Số lượng có sẵn</label>
          <input id="availableQuantity" name="availableQuantity" type="number" min="0" step="1" value={form.availableQuantity} onChange={handleChange} required />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm mới'}
          </button>
          <button type="button" onClick={() => navigate('/books')} className="btn btn-secondary" disabled={saving}>Hủy</button>
        </div>
      </form>
    </div>
  );
}

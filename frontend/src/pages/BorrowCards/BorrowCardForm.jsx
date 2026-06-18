import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';
import { getApiErrorMessage } from '../../utils/apiError';
import { BORROW_STATUSES, BORROW_STATUS_VALUES } from '../../utils/borrowStatus';
import { toDateTimeLocal, toIsoString } from '../../utils/date';

const emptyBorrowedBook = () => ({ book: '', quantity: 1 });

export default function BorrowCardForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [readers, setReaders] = useState([]);
  const [reader, setReader] = useState(null);
  const [processedBy, setProcessedBy] = useState(null);
  const [form, setForm] = useState({
    reader: '',
    borrowedBooks: [emptyBorrowedBook()],
    borrowDate: toDateTimeLocal(new Date()),
    dueDate: '',
    returnDate: '',
    status: 'borrowed',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        if (isEdit) {
          const [{ data: card }, { data: bookData }] = await Promise.all([
            API.get(`/borrow-cards/${id}`),
            API.get('/books'),
          ]);
          if (!active) return;

          setBooks(Array.isArray(bookData) ? bookData : []);
          setReader(card.reader || null);
          setProcessedBy(card.processedBy || null);
          setForm({
            reader: card.reader?._id || card.reader || '',
            borrowedBooks: card.borrowedBooks?.length
              ? card.borrowedBooks.map((item) => ({
                  book: item.book?._id || item.book || '',
                  quantity: item.quantity || 1,
                }))
              : [emptyBorrowedBook()],
            borrowDate: toDateTimeLocal(card.borrowDate),
            dueDate: toDateTimeLocal(card.dueDate),
            returnDate: toDateTimeLocal(card.returnDate),
            status: card.status || 'borrowed',
          });
        } else {
          const [{ data: bookData }, { data: readerData }] = await Promise.all([
            API.get('/books'),
            API.get('/users/readers'),
          ]);
          if (!active) return;
          setBooks(Array.isArray(bookData) ? bookData : []);
          setReaders(Array.isArray(readerData) ? readerData : []);
        }
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, `Không thể tải dữ liệu ${isEdit ? 'phiếu mượn' : 'tạo phiếu'}.`));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [id, isEdit]);

  const handleFieldChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleBookChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      borrowedBooks: current.borrowedBooks.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addBookRow = () => {
    setForm((current) => ({
      ...current,
      borrowedBooks: [...current.borrowedBooks, emptyBorrowedBook()],
    }));
  };

  const removeBookRow = (index) => {
    setForm((current) => ({
      ...current,
      borrowedBooks: current.borrowedBooks.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const validate = () => {
    if (!isEdit && !form.reader) return 'Vui lòng chọn độc giả.';
    if (form.borrowedBooks.length === 0) return 'Phiếu mượn phải có ít nhất một sách.';
    if (form.borrowedBooks.some((item) => !item.book)) return 'Vui lòng chọn sách cho tất cả các dòng.';

    const bookIds = form.borrowedBooks.map((item) => item.book);
    if (new Set(bookIds).size !== bookIds.length) return 'Mỗi đầu sách chỉ được xuất hiện một lần.';

    const hasInvalidQuantity = form.borrowedBooks.some((item) => {
      const quantity = Number(item.quantity);
      return !Number.isInteger(quantity) || quantity < 1;
    });
    if (hasInvalidQuantity) return 'Số lượng mượn phải là số nguyên từ 1 trở lên.';

    if (!form.borrowDate) return 'Vui lòng chọn ngày mượn.';
    const borrowTime = new Date(form.borrowDate).getTime();
    if (form.dueDate && new Date(form.dueDate).getTime() < borrowTime) {
      return 'Hạn trả không được sớm hơn ngày mượn.';
    }
    if (form.returnDate && new Date(form.returnDate).getTime() < borrowTime) {
      return 'Ngày trả không được sớm hơn ngày mượn.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      ...(!isEdit && { reader: form.reader }),
      borrowedBooks: form.borrowedBooks.map((item) => ({
        book: item.book,
        quantity: Number(item.quantity),
      })),
      borrowDate: toIsoString(form.borrowDate),
      status: form.status,
      ...(form.dueDate && { dueDate: toIsoString(form.dueDate) }),
      ...(form.returnDate && { returnDate: toIsoString(form.returnDate) }),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await API.put(`/borrow-cards/${id}`, payload);
        navigate(`/borrow-cards/${id}`);
      } else {
        const { data: createdCard } = await API.post('/borrow-cards', payload);
        navigate(`/borrow-cards/${createdCard._id}`);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Không thể ${isEdit ? 'cập nhật' : 'tạo'} phiếu mượn.`));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-panel">Đang tải dữ liệu phiếu mượn...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{isEdit ? '✏️ Sửa phiếu mượn' : '➕ Tạo phiếu mượn'}</h1>
          <p className="page-subtitle">{isEdit ? 'Cập nhật sách, thời hạn và trạng thái của phiếu.' : 'Chọn độc giả, sách mượn và thời hạn trả.'}</p>
        </div>
        <Link to={isEdit ? `/borrow-cards/${id}` : '/borrow-cards'} className="btn btn-secondary">Hủy</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form borrow-form">
        <section className="form-section">
          <h2>Thông tin xử lý</h2>
          {isEdit ? (
            <div className="form-row">
              <div className="form-group">
                <label>Độc giả</label>
                <div className="readonly-field">
                  <strong>{reader?.name || 'Không xác định'}</strong>
                  <span>{reader?.email || reader?._id || reader || '—'}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Người xử lý</label>
                <div className="readonly-field">
                  <strong>{processedBy?.name || 'Chưa xác định'}</strong>
                  <span>{processedBy?.email || processedBy?._id || processedBy || '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reader">Độc giả</label>
                <select id="reader" name="reader" value={form.reader} onChange={handleFieldChange} required>
                  <option value="">-- Chọn độc giả --</option>
                  {readers.map((item) => (
                    <option key={item._id} value={item._id}>{item.name} — {item.email}</option>
                  ))}
                </select>
                {readers.length === 0 && <p className="field-hint">Chưa có tài khoản độc giả nào để lập phiếu.</p>}
              </div>
              <div className="form-group">
                <label>Người xử lý</label>
                <div className="readonly-field">
                  <strong>Tài khoản đang đăng nhập</strong>
                  <span>Backend sẽ tự động ghi nhận người tạo phiếu.</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="section-heading">
            <div>
              <h2>Sách mượn</h2>
              <p>Chọn đầu sách và số lượng tương ứng.</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addBookRow}>+ Thêm sách</button>
          </div>

          <div className="borrowed-book-editor">
            {form.borrowedBooks.map((item, index) => {
              const selectedElsewhere = new Set(
                form.borrowedBooks.filter((_, itemIndex) => itemIndex !== index).map((entry) => entry.book),
              );
              return (
                <div className="borrowed-book-row" key={`${index}-${item.book}`}>
                  <div className="form-group">
                    <label htmlFor={`book-${index}`}>Sách #{index + 1}</label>
                    <select
                      id={`book-${index}`}
                      value={item.book}
                      onChange={(event) => handleBookChange(index, 'book', event.target.value)}
                      required
                    >
                      <option value="">-- Chọn sách --</option>
                      {books.map((book) => (
                        <option key={book._id} value={book._id} disabled={selectedElsewhere.has(book._id)}>
                          {book.title} — {book.author} (có sẵn: {book.availableQuantity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group quantity-field">
                    <label htmlFor={`quantity-${index}`}>Số lượng</label>
                    <input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => handleBookChange(index, 'quantity', event.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-delete btn-sm remove-book-button"
                    onClick={() => removeBookRow(index)}
                    disabled={form.borrowedBooks.length === 1}
                    aria-label={`Xóa sách thứ ${index + 1}`}
                  >
                    Xóa
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="form-section">
          <h2>Thời gian</h2>
          <div className="form-row three-columns">
            <div className="form-group">
              <label htmlFor="borrowDate">Ngày mượn</label>
              <input id="borrowDate" name="borrowDate" type="datetime-local" value={form.borrowDate} onChange={handleFieldChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Hạn trả</label>
              <input id="dueDate" name="dueDate" type="datetime-local" value={form.dueDate} onChange={handleFieldChange} />
            </div>
            <div className="form-group">
              <label htmlFor="returnDate">Ngày trả</label>
              <input id="returnDate" name="returnDate" type="datetime-local" value={form.returnDate} onChange={handleFieldChange} />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>Trạng thái</h2>
          <div className="status-options">
            {BORROW_STATUS_VALUES.map((status) => {
              const config = BORROW_STATUSES[status];
              return (
                <label key={status} className={`status-option status-option-${status} ${form.status === status ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={form.status === status}
                    onChange={handleFieldChange}
                  />
                  <span className="status-option-icon" aria-hidden="true">{config.icon}</span>
                  <span><strong>{config.label}</strong><small>{config.description}</small></span>
                </label>
              );
            })}
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật phiếu mượn' : 'Tạo phiếu mượn'}
          </button>
          <Link to={isEdit ? `/borrow-cards/${id}` : '/borrow-cards'} className="btn btn-secondary">Hủy</Link>
        </div>
      </form>
    </div>
  );
}

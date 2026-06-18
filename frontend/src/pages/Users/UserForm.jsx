import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

export default function UserForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', oldPassword: '', newPassword: '', role: 'reader' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      API.get('/users').then(({ data }) => {
        const user = data.find((u) => u._id === id);
        if (user) setForm({ name: user.name, email: user.email, password: '', oldPassword: '········', newPassword: '', role: user.role });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = { name: form.name, email: form.email, role: form.role };

    if (isEdit) {
      if (form.newPassword) {
        if (form.newPassword.length < 6) return setError('Mật khẩu mới phải có ít nhất 6 ký tự');
        payload.newPassword = form.newPassword;
      }
      await API.put(`/users/${id}`, payload);
    } else {
      payload.password = form.password;
      await API.post('/users', payload);
    }
    navigate('/users');
  };

  return (
    <div className="page">
      <h1>{isEdit ? '✏️ Sửa người dùng' : '➕ Thêm người dùng'}</h1>
      <form onSubmit={handleSubmit} className="form">
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label>Họ tên</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        {isEdit ? (
          <>
            <div className="form-group">
              <label>Mật khẩu cũ</label>
              <input name="oldPassword" type="password" value={form.oldPassword} readOnly />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} minLength={6} />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>Mật khẩu</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
        )}
        <div className="form-group">
          <label>Vai trò</label>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="reader">Reader</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">{isEdit ? 'Cập nhật' : 'Thêm mới'}</button>
          <button type="button" onClick={() => navigate('/users')} className="btn btn-secondary">Hủy</button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../api/axios';

export default function UserForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reader' });

  useEffect(() => {
    if (isEdit) {
      API.get('/users').then(({ data }) => {
        const user = data.find((u) => u._id === id);
        if (user) setForm({ name: user.name, email: user.email, password: '', role: user.role });
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (isEdit && !payload.password) delete payload.password;
    if (isEdit) {
      await API.put(`/users/${id}`, payload);
    } else {
      await API.post('/users', payload);
    }
    navigate('/users');
  };

  return (
    <div className="page">
      <h1>{isEdit ? '✏️ Sửa người dùng' : '➕ Thêm người dùng'}</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Họ tên</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Mật khẩu {isEdit && '(để trống nếu không đổi)'}</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required={!isEdit} />
        </div>
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

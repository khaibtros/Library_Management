import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Dang ky cong khai luon la role 'reader'. Backend
      // (authController.registerUser) cung ep cung mot gia tri
      // nay du client gui gi len, day chi la khop UI voi logic do.
      await register(form.name, form.email, form.password, 'reader');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>📚 Đăng ký</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Họ tên</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
          <p className="form-hint">
            Tài khoản đăng ký mới sẽ có vai trò <strong>Độc giả</strong>. Tài khoản Thủ thư/Admin do quản trị viên tạo.
          </p>
          <button type="submit" className="btn btn-primary btn-full">Đăng ký</button>
        </form>
        <p className="auth-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

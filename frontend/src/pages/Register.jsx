import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  isValidName,
  isValidEmail,
  isValidStudentId,
  isValidPhone,
  isStrongPassword,
  PASSWORD_HINT,
} from '../utils/validators';
import { getApiErrorMessage } from '../utils/apiError';

const initialForm = {
  name: '',
  email: '',
  studentId: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errors = {};
    if (!isValidName(form.name)) {
      errors.name = 'Họ tên không được để trống và phải từ 3-50 ký tự';
    }
    if (!form.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!isValidEmail(form.email)) {
      errors.email = 'Email không đúng định dạng';
    }
    if (!form.studentId.trim()) {
      errors.studentId = 'Mã sinh viên không được để trống';
    } else if (!isValidStudentId(form.studentId)) {
      errors.studentId = 'Mã sinh viên phải từ 6-20 ký tự';
    }
    if (!isValidPhone(form.phone)) {
      errors.phone = 'Số điện thoại chỉ chứa số, gồm 10 hoặc 11 số';
    }
    if (!isStrongPassword(form.password)) {
      errors.password = PASSWORD_HINT;
    }
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Dang ky cong khai luon la role 'reader' (backend ep san du client
      // gui gi len - xem authController.registerUser).
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <h1>📚 Đăng ký</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Họ tên</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required />
            {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="studentId">Mã sinh viên</label>
              <input id="studentId" name="studentId" value={form.studentId} onChange={handleChange} required />
              {fieldErrors.studentId && <p className="field-error">{fieldErrors.studentId}</p>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Số điện thoại</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
              {fieldErrors.phone && <p className="field-error">{fieldErrors.phone}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
              {fieldErrors.password ? (
                <p className="field-error">{fieldErrors.password}</p>
              ) : (
                <p className="field-hint">{PASSWORD_HINT}</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
            </div>
          </div>
          <p className="form-hint">
            Tài khoản đăng ký mới sẽ có vai trò <strong>Độc giả</strong>. Tài khoản Thủ thư/Admin do quản trị viên tạo.
          </p>
          <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
            {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="auth-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

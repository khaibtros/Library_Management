import { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';

const ROLE_LABELS = { admin: 'Admin', librarian: 'Thủ thư', reader: 'Độc giả' };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchMe = async () => {
      try {
        const { data } = await API.get('/users/me');
        if (active) setForm({ name: data.name || '', email: data.email || '' });
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Không thể tải thông tin hồ sơ.'));
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMe();
    return () => { active = false; };
  }, []);

  const handleFieldChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handlePasswordFieldChange = (event) => {
    setPasswordForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên và email.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await API.put('/users/me', { name: form.name.trim(), email: form.email.trim() });
      updateUser({ name: data.name, email: data.email });
      setSuccess('Đã cập nhật thông tin cá nhân.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể cập nhật thông tin.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      await API.put('/users/me', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Đã đổi mật khẩu thành công.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (requestError) {
      setPasswordError(getApiErrorMessage(requestError, 'Không thể đổi mật khẩu.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <div className="loading-panel">Đang tải thông tin hồ sơ...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>👤 Hồ sơ cá nhân</h1>
          <p className="page-subtitle">
            Vai trò hiện tại: <strong>{ROLE_LABELS[user?.role] || user?.role}</strong>
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <h2>Thông tin cơ bản</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSaveProfile} className="form-stack">
            <div className="form-group">
              <label htmlFor="name">Họ tên</label>
              <input id="name" name="name" value={form.name} onChange={handleFieldChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleFieldChange} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </section>

        <section className="detail-card">
          <h2>Đổi mật khẩu</h2>
          {passwordError && <div className="alert alert-error">{passwordError}</div>}
          {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
          <form onSubmit={handleChangePassword} className="form-stack">
            <div className="form-group">
              <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordFieldChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordFieldChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordFieldChange}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

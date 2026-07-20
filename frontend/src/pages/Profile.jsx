import { useEffect, useRef, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../utils/apiError';
import { isValidName, isValidPhone } from '../utils/validators';

const ROLE_LABELS = { admin: 'Admin', librarian: 'Thủ thư', reader: 'Độc giả' };
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchMe = async () => {
      try {
        const { data } = await API.get('/users/me');
        if (!active) return;
        setMe(data);
        setForm({ name: data.name || '', phone: data.phone || '', address: data.address || '' });
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

    if (!isValidName(form.name)) {
      setError('Họ tên phải từ 3-50 ký tự.');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Số điện thoại chỉ chứa số, gồm 10 hoặc 11 số.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await API.put('/users/me', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      setMe(data);
      updateUser({ name: data.name });
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

  const handleAvatarSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // cho phep chon lai cung file lan sau
    if (!file) return;

    setAvatarError('');
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Chỉ chấp nhận ảnh định dạng jpg, jpeg, png hoặc webp.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError('Dung lượng ảnh tối đa 2MB.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const { data } = await API.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMe(data);
      updateUser({ avatar: data.avatar });
    } catch (requestError) {
      setAvatarError(getApiErrorMessage(requestError, 'Không thể tải ảnh lên.'));
    } finally {
      setUploadingAvatar(false);
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

      <div className="detail-grid profile-grid">
        <section className="detail-card avatar-card">
          <h2>Ảnh đại diện</h2>
          {me?.avatar ? (
            <img src={me.avatar} alt={me.name} className="avatar-preview" />
          ) : (
            <div className="avatar-preview avatar-preview-placeholder">👤</div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarSelect}
            hidden
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
          </button>
          <p className="field-hint">Định dạng jpg, jpeg, png, webp — tối đa 2MB.</p>
          {avatarError && <p className="field-error">{avatarError}</p>}
        </section>

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
              <label htmlFor="phone">Số điện thoại</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleFieldChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="address">Địa chỉ</label>
              <input id="address" name="address" value={form.address} onChange={handleFieldChange} />
            </div>
            <div className="readonly-field">
              <label>Email</label>
              <span>{me?.email} (không thể thay đổi)</span>
            </div>
            {me?.studentId && (
              <div className="readonly-field">
                <label>Mã sinh viên</label>
                <span>{me.studentId} (không thể thay đổi)</span>
              </div>
            )}
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

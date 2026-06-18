import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/dashboard/stats');
        setStats(data);
      } catch { }
    };
    fetchStats();
  }, []);

  return (
    <div className="page">
      <h1>Dashboard</h1>
      {user?.role === 'admin' && stats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📖</span>
            <div>
              <h3>{stats.totalBooks}</h3>
              <p>Tổng số sách</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👥</span>
            <div>
              <h3>{stats.users.total}</h3>
              <p>Tổng người dùng</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🛡️</span>
            <div>
              <h3>{stats.users.admin}</h3>
              <p>Admin</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📋</span>
            <div>
              <h3>{stats.users.librarian}</h3>
              <p>Librarian</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👤</span>
            <div>
              <h3>{stats.users.reader}</h3>
              <p>Reader</p>
            </div>
          </div>
        </div>
      ) : (
        <p>Chào mừng bạn đến với hệ thống quản lý thư viện!</p>
      )}
    </div>
  );
}

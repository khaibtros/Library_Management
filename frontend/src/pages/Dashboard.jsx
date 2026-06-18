import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const BORROW_COLORS = { borrowed: '#3b82f6', returned: '#22c55e', overdue: '#ef4444', cancelled: '#94a3b8' };
const ROLE_COLORS = { admin: '#ef4444', librarian: '#3b82f6', reader: '#22c55e' };
const CURRENT_YEAR = new Date().getFullYear();

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card-modern" style={{ '--accent': color }}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-info">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontWeight: 600 }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function PieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p style={{ fontWeight: 600, color: payload[0].payload.color || payload[0].color }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error('Dashboard stats error:', err);
      }
      setLoading(false);
    };
    if (user?.role === 'admin') fetchStats();
    else setLoading(false);
  }, [user]);

  if (loading) return <div className="loading">Đang tải...</div>;

  if (user?.role !== 'admin') {
    return (
      <div className="page">
        <div className="welcome-card">
          <h1>Chào mừng đến với Hệ thống Quản lý Thư viện</h1>
          <p>Bạn đang đăng nhập với vai trò <strong>{user?.role === 'librarian' ? 'Thủ thư' : 'Độc giả'}</strong>.</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <p>Không thể tải dữ liệu thống kê.</p>
      </div>
    );
  }

  const s = stats || {};
  const users = s.users || {};

  const userRoleData = [
    { name: 'Admin', value: users.admin, color: ROLE_COLORS.admin },
    { name: 'Librarian', value: users.librarian, color: ROLE_COLORS.librarian },
    { name: 'Reader', value: users.reader, color: ROLE_COLORS.reader },
  ].filter(d => d.value > 0);

  const borrowStatusData = [
    { name: 'Đang mượn', value: s.totalBorrowed, color: BORROW_COLORS.borrowed },
    { name: 'Đã trả', value: s.totalReturned, color: BORROW_COLORS.returned },
    { name: 'Quá hạn', value: s.totalOverdue, color: BORROW_COLORS.overdue },
    { name: 'Đã hủy', value: s.totalCancelled, color: BORROW_COLORS.cancelled },
  ].filter(d => d.value > 0);

  const categoryData = (s.booksByCategory || []).map((item, i) => ({
    name: item._id || 'Khác',
    count: item.count || 0,
    color: COLORS[i % COLORS.length],
  }));

  const borrowMonthly = s.monthlyBorrows || { labels: [], data: [] };
  const monthlyData = borrowMonthly.labels.map((label, i) => ({
    name: label,
    'Lượt mượn': borrowMonthly.data[i] || 0,
  }));

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <span className="dashboard-date">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="stats-row">
        <StatCard icon="📚" label="Tổng sách" value={s.totalBooks || 0} color="#4f46e5" />
        <StatCard icon="👥" label="Người dùng" value={users.total || 0} color="#22c55e" />
        <StatCard icon="📖" label="Đang mượn" value={s.totalBorrowed || 0} color="#3b82f6" />
        <StatCard icon="⏰" label="Quá hạn" value={s.totalOverdue || 0} color="#ef4444" />
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3 className="chart-title">Sách theo thể loại</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Số lượng" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Chưa có dữ liệu sách.</div>
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Người dùng theo vai trò</h3>
          {userRoleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={userRoleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {userRoleData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Chưa có dữ liệu người dùng.</div>
          )}
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Trạng thái mượn sách</h3>
          {borrowStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={borrowStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {borrowStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Chưa có dữ liệu mượn sách.</div>
          )}
        </div>

        <div className="chart-card chart-card-wide">
          <h3 className="chart-title">Lượt mượn theo tháng ({CURRENT_YEAR})</h3>
          {borrowMonthly.data.some(v => v > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Lượt mượn" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Chưa có lượt mượn nào trong năm {CURRENT_YEAR}.</div>
          )}
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Hoạt động gần đây</h3>
        {s.recentBorrows && s.recentBorrows.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Độc giả</th>
                <th>Sách</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {s.recentBorrows.map((card) => (
                <tr key={card._id}>
                  <td>{card.reader?.name || 'N/A'}</td>
                  <td>{card.borrowedBooks?.map(b => b.book?.title).join(', ') || 'N/A'}</td>
                  <td>{new Date(card.borrowDate).toLocaleDateString('vi-VN')}</td>
                  <td>{card.dueDate ? new Date(card.dueDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>
                    <span className={`badge badge-${card.status}`}>
                      {card.status === 'borrowed' ? 'Đang mượn' :
                        card.status === 'returned' ? 'Đã trả' :
                          card.status === 'overdue' ? 'Quá hạn' : 'Đã hủy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">Chưa có hoạt động mượn sách.</p>
        )}
      </div>
    </div>
  );
}

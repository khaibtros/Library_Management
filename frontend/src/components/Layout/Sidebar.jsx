import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const linkClass = ({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link';

export default function Sidebar() {
  const { user } = useAuth();
  const canManageLibrary = user?.role === 'admin' || user?.role === 'librarian';

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={linkClass}>
          📊 Dashboard
        </NavLink>
        <NavLink to="/books" className={linkClass}>
          📖 Sách
        </NavLink>
        {canManageLibrary && (
          <NavLink to="/borrow-cards" className={linkClass}>
            📋 Phiếu mượn
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/users" className={linkClass}>
            👥 Người dùng
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

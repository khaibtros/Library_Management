import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const linkClass = ({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link';

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={linkClass}>
          📊 Dashboard
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/users" className={linkClass}>
            👥 Người dùng
          </NavLink>
        )}
      </nav>
    </aside>
  );
}

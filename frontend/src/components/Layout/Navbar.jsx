import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">📚 Library Management</Link>
      <div className="navbar-menu">
        <span className="navbar-user">Xin chào, {user?.name}</span>
        <button onClick={handleLogout} className="btn btn-logout">Đăng xuất</button>
      </div>
    </nav>
  );
}

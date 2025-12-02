import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showNav = isAuthenticated && location.pathname !== '/login';

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">Conatus Reembolsos</span>
        {showNav && (
          <nav className="nav">
            <Link to="/">Viagens</Link>
            {(user?.roles || []).includes('approver') && <Link to="/approvals">Aprovações</Link>}
            <button className="text-button" onClick={handleLogout}>
              Sair
            </button>
          </nav>
        )}
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

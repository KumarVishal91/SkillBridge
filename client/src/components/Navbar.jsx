import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [pending, setPending] = useState(0);

  // badge = booking requests waiting for my answer
  useEffect(() => {
    const load = () =>
      api
        .get('/bookings')
        .then((r) => setPending(r.data.filter((b) => b.status === 'pending' && b.partner._id === user._id).length))
        .catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [user._id]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <span className="brand">🔄 SkillBridge</span>
        <nav>
          <NavLink to="/" end>Matches</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/sessions">
            Sessions{pending > 0 && <span className="badge">{pending}</span>}
          </NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <div className="nav-user">
          <button className="icon-btn" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span className="muted">{user.name}</span>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}

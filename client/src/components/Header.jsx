import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_URL } from '../config/api.js';

export default function Header() {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token invalide
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowMenu(false);
    window.location.href = '/';
  };

  return (
    <header 
      className="fixed top-0 right-0 left-64 h-16 bg-bg-secondary/80 backdrop-blur-md border-b border-border-secondary/50 px-6 flex items-center justify-end z-40"
      style={{
        color: 'var(--text-primary, #e8ecf3)',
        backgroundColor: 'rgba(19, 24, 37, 0.8)'
      }}
    >
      {user ? (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-border-secondary/30"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 border-2 border-border-secondary/30 flex items-center justify-center text-accent-primary font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-text-primary font-medium">{user.username}</span>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary/95 backdrop-blur-md border border-border-secondary/50 rounded-lg shadow-xl z-50 py-2">
                <Link
                  to={`/profile/${user.username || user.id}`}
                  className="block px-4 py-2 text-text-primary hover:bg-bg-tertiary/50 transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-text-primary hover:bg-bg-tertiary/50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-text-secondary hover:text-text-primary transition-colors font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-accent-primary/20"
          >
            Register
          </Link>
        </div>
      )}
    </header>
  )
}


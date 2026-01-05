import { Link, useLocation } from 'react-router-dom'

const menuItems = [
  { path: '/rankings', label: 'Rankings', icon: '🏆' },
  { path: '/competitions', label: 'Competitions', icon: '⚔️' },
  { path: '/matchmaking', label: 'Matchmaking', icon: '🎯' },
  { path: '/battle', label: 'Create Room', icon: '🔗' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-bg-secondary/60 backdrop-blur-sm p-6 flex flex-col">
      <Link to="/" className="mb-8 group">
        <h1 className="text-2xl font-bold text-text-primary group-hover:text-accent-primary transition-colors" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
          typingpvp.com
        </h1>
      </Link>

      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path === '/battle' && location.pathname.startsWith('/battle'));
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-primary/30'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto pt-6">
        <Link
          to="/solo"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-primary transition-all duration-200"
        >
          <span className="text-xl">⌨️</span>
          <span className="font-medium">Solo Practice</span>
        </Link>
      </div>
    </aside>
  )
}


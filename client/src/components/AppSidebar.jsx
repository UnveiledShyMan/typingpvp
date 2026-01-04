// Sidebar pour MainPage avec navigation par sections - Responsive avec menu mobile
import LogoIcon from './icons/LogoIcon'
import LogoIconSmall from './icons/LogoIconSmall'
import KeyboardIcon from './icons/KeyboardIcon'
import SwordIcon from './icons/SwordIcon'
import TrophyIcon from './icons/TrophyIcon'
import CompetitionIcon from './icons/CompetitionIcon'
import MatchmakingIcon from './icons/MatchmakingIcon'
import FriendsIcon from './icons/FriendsIcon'
import XIcon from './icons/XIcon'

export default function AppSidebar({ activeSection, onSectionChange, user, isOpen = false, onClose }) {
  // Sections de navigation - Solo en premier (page principale), Friends n'apparaît que si l'utilisateur est connecté
  const baseSections = [
    { id: 'solo', label: 'Solo', Icon: KeyboardIcon },
    { id: 'battle', label: '1v1', Icon: SwordIcon },
    { id: 'rankings', label: 'Rankings', Icon: TrophyIcon },
    { id: 'competitions', label: 'Competitions', Icon: CompetitionIcon },
    { id: 'matchmaking', label: 'Matchmaking', Icon: MatchmakingIcon },
  ];
  
  const sections = user 
    ? [...baseSections, { id: 'friends', label: 'Friends', Icon: FriendsIcon }]
    : baseSections;

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-64 z-50 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}
    style={{
      background: 'linear-gradient(to right, rgba(10, 14, 26, 0.4) 0%, rgba(10, 14, 26, 0) 100%)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}
    >
      {/* Logo et titre avec bouton fermer pour mobile - Transparent et minimaliste */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group flex-1" onClick={() => onSectionChange('solo')}>
          <LogoIcon 
            className="w-8 h-8 text-text-primary/80 group-hover:text-accent-primary transition-all duration-200" 
            stroke="currentColor"
          />
          <h1 
            className="text-xl font-bold text-text-primary/90 group-hover:text-accent-primary transition-all duration-200"
            style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}
          >
            typingpvp.com
          </h1>
        </div>
        {/* Bouton fermer pour mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-text-secondary/60 hover:text-text-primary/80 transition-colors"
          aria-label="Close menu"
        >
          <XIcon className="w-5 h-5" stroke="currentColor" />
        </button>
      </div>

      {/* Navigation - Minimaliste et transparente */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {sections.map((section) => {
            const Icon = section.Icon;
            const isActive = activeSection === section.id;
            
            return (
              <li key={section.id}>
                <button
                  onClick={() => onSectionChange(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-accent-primary'
                      : 'text-text-secondary/70 hover:text-text-primary/90'
                  }`}
                >
                  <Icon 
                    className="w-5 h-5 transition-all duration-200" 
                    stroke={isActive ? '#8b5cf6' : 'currentColor'}
                    style={{ opacity: isActive ? 1 : 0.7 }}
                  />
                  <span className={isActive ? 'font-semibold' : 'font-medium'}>{section.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Section utilisateur en bas (si connecté) - Minimaliste */}
      {user && (
        <div className="p-4">
          <button
            onClick={() => onSectionChange('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'profile'
                ? 'text-accent-primary'
                : 'text-text-secondary/70 hover:text-text-primary/90'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-bg-primary/30 overflow-hidden flex items-center justify-center backdrop-blur-sm">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <LogoIconSmall 
                  className="w-5 h-5 text-accent-primary/80" 
                  stroke="currentColor"
                />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className={`font-medium ${activeSection === 'profile' ? 'text-accent-primary' : 'text-text-primary/90'}`}>{user.username}</div>
              <div className="text-xs text-text-secondary/50">View Profile</div>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}


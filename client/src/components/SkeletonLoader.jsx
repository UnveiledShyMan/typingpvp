/**
 * Composant Skeleton Loader réutilisable
 * Utilisé pour afficher un état de chargement élégant
 */

export function SkeletonLoader({ className = '', lines = 3, width = 'full' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-bg-secondary/40 rounded mb-2 ${
            i === lines - 1 ? `w-${width === 'full' ? 'full' : '3/4'}` : 'w-full'
          }`}
          style={{
            animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton pour les tableaux (rankings, etc.)
 */
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div
              key={j}
              className={`h-6 bg-bg-secondary/40 rounded ${
                j === 0 ? 'w-12' : j === 1 ? 'flex-1' : 'w-24'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour les cartes de profil
 */
export function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-bg-secondary/40 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-bg-secondary/40 rounded w-1/3" />
          <div className="h-4 bg-bg-secondary/40 rounded w-1/4" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <div className="h-8 bg-bg-secondary/40 rounded w-16 mx-auto" />
            <div className="h-4 bg-bg-secondary/40 rounded w-12 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <div className="h-4 bg-bg-secondary/40 rounded w-full" />
        <div className="h-4 bg-bg-secondary/40 rounded w-5/6" />
        <div className="h-4 bg-bg-secondary/40 rounded w-4/6" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour les listes d'amis
 */
export function FriendsListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-bg-secondary/40 rounded-lg">
          <div className="w-12 h-12 bg-bg-secondary/60 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-secondary/60 rounded w-1/4" />
            <div className="h-3 bg-bg-secondary/60 rounded w-1/6" />
          </div>
          <div className="w-20 h-8 bg-bg-secondary/60 rounded" />
        </div>
      ))}
    </div>
  );
}


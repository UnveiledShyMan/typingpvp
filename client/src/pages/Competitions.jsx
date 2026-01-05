import CompetitionIcon from '../components/icons/CompetitionIcon'
import DiscordIcon from '../components/icons/DiscordIcon'

export default function Competitions() {
  return (
    <div className="h-full w-full flex items-center justify-center p-4 sm:p-6">
      <div className="text-center space-y-6 max-w-md">
        {/* Icône de compétition */}
        <div className="flex justify-center">
          <div className="relative">
            <CompetitionIcon 
              className="w-24 h-24 text-accent-primary/30" 
              stroke="currentColor"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-accent-primary/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
          Coming Soon
        </h1>

        {/* Description */}
        <p className="text-text-secondary text-lg leading-relaxed">
          We're working hard to bring you exciting competitive typing tournaments. 
          Stay tuned for updates!
        </p>

        {/* Message Discord */}
        <div className="bg-bg-secondary/40 backdrop-blur-sm border border-accent-primary/20 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-text-secondary text-sm leading-relaxed">
            Pour patienter et être informé des mises à jour, rejoignez notre{' '}
            <a
              href="https://discord.gg/ztc3gnVmAd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:text-accent-primary/80 transition-colors font-medium inline-flex items-center gap-1.5"
            >
              <DiscordIcon className="w-4 h-4" fill="currentColor" />
              <span>Discord</span>
            </a>
            {' '}!
          </p>
        </div>

        {/* Badge informatif */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/20 rounded-full">
          <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
          <span className="text-text-secondary text-sm font-medium">In Development</span>
        </div>
      </div>
    </div>
  )
}

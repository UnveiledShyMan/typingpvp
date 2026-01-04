import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-6xl font-bold text-text-primary mb-3 animate-fade-in" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
          typingpvp.com
        </h1>
        <p className="text-text-secondary mb-16 text-xl">
          Test your speed. Challenge others. Win.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto mb-12">
          <Link
            to="/solo"
            className="bg-bg-secondary hover:bg-bg-tertiary border border-text-secondary/10 hover:border-accent-primary/30 transition-all duration-300 p-8 rounded-lg text-left group animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="text-text-primary font-semibold mb-2 text-lg group-hover:text-accent-primary transition-colors">Solo</div>
            <p className="text-text-secondary">
              Practice on your own
            </p>
          </Link>
          
          <Link
            to="/battle"
            className="bg-bg-secondary hover:bg-bg-tertiary border border-text-secondary/10 hover:border-accent-primary/30 transition-all duration-300 p-8 rounded-lg text-left group animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="text-text-primary font-semibold mb-2 text-lg group-hover:text-accent-primary transition-colors">1v1</div>
            <p className="text-text-secondary">
              Private rooms. Real-time battles.
            </p>
          </Link>
        </div>
        
        <div className="text-text-secondary text-sm flex items-center gap-4">
          <Link to="/rankings" className="hover:text-text-primary transition-colors">Rankings</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-text-primary transition-colors">Login</Link>
          <span>·</span>
          <Link to="/signup" className="hover:text-text-primary transition-colors">Sign up</Link>
        </div>
      </div>
    </div>
  )
}

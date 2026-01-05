import { useState } from 'react'
import OAuthButton from '../components/OAuthButton'
import { useToastContext } from '../contexts/ToastContext'
import { authService } from '../services/apiService'
import FormField from '../components/FormField'

export default function Register({ onSuccess, onSwitch }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToastContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.register(username, email, password);
      if (onSuccess) onSuccess();
      toast.success('Inscription réussie !');
    } catch (error) {
      // L'erreur est déjà gérée par apiService (toast automatique)
      setError(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-md w-full animate-slide-up">
      <h1 className="text-4xl font-bold text-text-primary mb-8 text-center" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Register
      </h1>
      <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <FormField
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Choose a username"
            autoComplete="username"
            validation={(value) => {
              if (value.length < 3) return 'Username must be at least 3 characters';
              if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
              return true;
            }}
          />

          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            autoComplete="email"
          />

          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Create a password (min 6 characters)"
            autoComplete="new-password"
            validation={(value) => {
              if (value.length < 6) return 'Password must be at least 6 characters';
              return true;
            }}
          />

          <FormField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your password"
            autoComplete="new-password"
            validation={(value) => {
              if (value !== password) return 'Passwords do not match';
              return true;
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Inscription...</span>
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>

        {/* Séparateur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-text-secondary/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-secondary/40 text-text-secondary">Or sign up with</span>
          </div>
        </div>

        {/* Bouton OAuth Google */}
        <OAuthButton onSuccess={onSuccess} />

        <div className="mt-6 text-center text-text-secondary text-sm">
          Already have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            Login
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}


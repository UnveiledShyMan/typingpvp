import { useState } from 'react'
import OAuthButton from '../components/OAuthButton'
import { useToastContext } from '../contexts/ToastContext'
import { authService } from '../services/apiService'
import FormField from '../components/FormField'

export default function Login({ onSuccess, onSwitch }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToastContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      if (onSuccess) onSuccess();
      toast.success('Connexion réussie !');
    } catch (error) {
      // L'erreur est déjà gérée par apiService (toast automatique)
      // Mais on garde l'erreur locale pour l'affichage dans le formulaire
      setError(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-md w-full animate-slide-up">
      <h1 className="text-4xl font-bold text-text-primary mb-8 text-center" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Login
      </h1>
      <div className="bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <FormField
            label="Username or Email"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter your username or email"
            autoComplete="username"
          />

          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
            validation={(value) => {
              if (value.length < 1) return 'Password is required';
              return true;
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Connexion...</span>
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Séparateur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-text-secondary/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-bg-secondary/40 text-text-secondary">Or continue with</span>
          </div>
        </div>

        {/* Bouton OAuth Google */}
        <OAuthButton onSuccess={onSuccess} />

        <div className="mt-6 text-center text-text-secondary text-sm">
          Don't have an account?{' '}
          <button
            onClick={onSwitch}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            Register
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}


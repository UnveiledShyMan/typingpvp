import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Register({ onSuccess, onSwitch }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      localStorage.setItem('token', data.token);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Register error:', error);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      setError(`Network error: ${error.message}. Please make sure the server is running on ${API_URL}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8 animate-fade-in">
      <div className="max-w-md w-full animate-slide-up">
      <h1 className="text-4xl font-bold text-text-primary mb-8 text-center" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>
        Register
      </h1>
      <div className="bg-bg-secondary rounded-lg border border-text-secondary/10 p-8 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-text-primary mb-2 text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              required
            />
          </div>

          <div>
            <label className="block text-text-primary mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              required
            />
          </div>

          <div>
            <label className="block text-text-primary mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              required
            />
          </div>

          <div>
            <label className="block text-text-primary mb-2 text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-bg-primary border border-text-secondary/20 rounded-lg text-text-primary focus:outline-none focus:border-accent-primary"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Register
          </button>
        </form>

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


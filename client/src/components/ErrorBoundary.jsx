/**
 * Error Boundary Component
 * Capture les erreurs React et affiche un fallback UI au lieu de crasher l'app
 * 
 * Utilisation :
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher le fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur pour le debugging avec plus de détails
    console.error('❌ ErrorBoundary caught an error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Component stack:', errorInfo?.componentStack);
    console.error('Full error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Ici on pourrait envoyer l'erreur à un service de tracking (Sentry, etc.)
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI personnalisé
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-bg-secondary/40 backdrop-blur-sm rounded-lg p-8 border border-border-secondary/50">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Something went wrong
              </h1>
              <p className="text-text-secondary mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-6 py-3 bg-accent-primary hover:bg-accent-hover text-accent-text font-semibold rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-bg-primary/50 hover:bg-bg-primary/70 text-text-primary font-medium rounded-lg transition-colors"
                >
                  Refresh Page
                </button>
              </div>

              {/* Afficher les détails de l'erreur en développement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-text-secondary hover:text-text-primary text-sm mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="bg-bg-primary/50 p-4 rounded text-xs text-red-400 overflow-auto max-h-64">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


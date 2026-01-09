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
    // IMPORTANT: Toujours logger même en production pour le debugging
    // Utiliser console.group pour regrouper les logs et les rendre plus visibles
    console.group('🔴 ERRORBOUNDARY CAUGHT ERROR - TIMESTAMP:', new Date().toISOString());
    console.error('❌ ErrorBoundary caught an error:', error);
    console.error('❌ Error name:', error?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error toString:', error?.toString());
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Component stack:', errorInfo?.componentStack);
    console.error('❌ Full error info:', errorInfo);
    console.error('❌ Error keys:', Object.keys(error || {}));
    console.error('❌ ErrorInfo keys:', Object.keys(errorInfo || {}));
    
    // Afficher aussi les props et state actuels si disponibles
    try {
      console.error('❌ Current state:', this.state);
      console.error('❌ Current props:', this.props);
    } catch (e) {
      console.error('❌ Could not log state/props:', e);
    }
    
    // Forcer l'affichage dans un alert aussi pour être sûr qu'on voit l'erreur
    // Même en production pour le debugging
    try {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      const componentStack = errorInfo?.componentStack || 'No component stack';
      const fullError = `${errorMessage}\n\nComponent Stack:\n${componentStack}`;
      console.error('❌ FULL ERROR FOR ALERT:', fullError);
      // Ne pas utiliser alert() car ça bloque, mais logguer très visiblement
      console.error('='.repeat(80));
      console.error('ERROR DETAILS (COPY THIS):');
      console.error('='.repeat(80));
      console.error(fullError);
      console.error('='.repeat(80));
    } catch (e) {
      console.error('❌ Error formatting error details:', e);
    }
    
    console.groupEnd();
    
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
    console.log('🔄 ErrorBoundary: Try Again clicked');
    console.log('🔄 Current error:', this.state.error);
    console.log('🔄 Attempting to reset ErrorBoundary state and redirect...');
    
    // Au lieu de juste réinitialiser, rediriger vers la page principale pour éviter que l'erreur se reproduise
    // Cela évite le problème où l'erreur se reproduit immédiatement après le reset
    window.location.href = '/';
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

              {/* Afficher TOUJOURS les détails de l'erreur pour le debugging (même en production) */}
              {this.state.error && (
                <details className="mt-6 text-left" open>
                  <summary className="cursor-pointer text-text-secondary hover:text-text-primary text-sm mb-2 font-bold">
                    Error Details (Click to expand/collapse) - CHECK CONSOLE FOR MORE INFO
                  </summary>
                  <div className="bg-bg-primary/50 p-4 rounded text-xs text-red-400 overflow-auto max-h-64 space-y-2">
                    <div>
                      <strong>Error Name:</strong> {this.state.error?.name || 'Unknown'}
                    </div>
                    <div>
                      <strong>Error Message:</strong> {this.state.error?.message || this.state.error?.toString() || 'No message'}
                    </div>
                    {this.state.error?.stack && (
                      <div>
                        <strong>Error Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">{this.state.error.stack}</pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-border-secondary/30">
                      <strong>Full Error Object:</strong>
                      <pre className="mt-1 whitespace-pre-wrap text-xs">{JSON.stringify(this.state.error, Object.getOwnPropertyNames(this.state.error), 2)}</pre>
                    </div>
                  </div>
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


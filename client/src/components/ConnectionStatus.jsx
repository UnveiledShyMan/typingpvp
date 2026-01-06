/**
 * Composant pour afficher l'état de la connexion Socket.io
 * Affiche un indicateur visuel (vert = connecté, rouge = déconnecté)
 */

import { useState, useEffect } from 'react';
import { getSocket } from '../services/socketService';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    
    // Vérifier l'état initial
    setIsConnected(socket.connected);
    
    // Écouter les événements de connexion
    const handleConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      setIsReconnecting(true);
    };
    
    const handleReconnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };
    
    const handleReconnectAttempt = () => {
      setIsReconnecting(true);
    };
    
    // Ajouter les listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    
    // Nettoyage
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, []);

  // Ne pas afficher si connecté (pour ne pas encombrer l'UI)
  if (isConnected && !isReconnecting) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/40 backdrop-blur-sm border border-border-secondary/30">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : isReconnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span className="text-xs text-text-secondary font-medium">
        {isReconnecting ? 'Reconnecting...' : isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}


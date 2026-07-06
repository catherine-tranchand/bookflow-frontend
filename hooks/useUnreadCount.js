// hooks/useUnreadCount.js
import { useEffect, useState, useRef } from 'react';
import { AppState } from 'react-native';
import { countUnreadMessages } from '../lib/chat';

/**
 * Hook qui retourne le nombre total de messages non-lus pour un user.
 * Refresh automatique toutes les 5 secondes via polling.
 * Pause le polling quand l'app passe en background.
 */
export function useUnreadCount(userId, intervalMs = 5000) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const refresh = async () => {
    if (!userId) return;
    try {
      const c = await countUnreadMessages(userId);
      setCount(c);
    } catch (err) {
      console.error('[useUnreadCount] Erreur refresh:', err);
    }
  };

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    // Premier fetch immédiat
    refresh();

    // Polling
    intervalRef.current = setInterval(refresh, intervalMs);

    // Pause quand l'app est en background (économie batterie)
    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        refresh(); // refresh au retour en foreground
      }
      appState.current = nextState;
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [userId, intervalMs]);

  return { count, refresh };
}
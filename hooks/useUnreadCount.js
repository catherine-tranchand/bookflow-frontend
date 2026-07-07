// hooks/useUnreadCount.js
import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { countUnreadMessages } from '../lib/chat';
import { supabase } from '../lib/supabase';

export function useUnreadCount(userId) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const c = await countUnreadMessages(userId);
      setCount(c);
    } catch (err) {
      console.error('[useUnreadCount] error:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }

    refresh();

    // Realtime: any insert or update on messages triggers a count refresh
    const channel = supabase
      .channel(`unread-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, refresh)
      .subscribe();

    // Refresh when app returns to foreground in case events were missed
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      supabase.removeChannel(channel);
      appStateSub.remove();
    };
  }, [userId, refresh]);

  return { count, refresh };
}

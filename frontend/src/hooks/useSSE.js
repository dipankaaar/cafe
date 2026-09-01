import { useEffect } from 'react';
import { api } from '../services/api';

/**
 * Custom React Hook to subscribe to Live Server-Sent Events
 */
export function useSSE(onEvent) {
  useEffect(() => {
    if (!onEvent) return;
    const sseConnection = api.subscribeToEvents(onEvent);

    return () => {
      if (sseConnection) {
        sseConnection.close();
      }
    };
  }, [onEvent]);
}

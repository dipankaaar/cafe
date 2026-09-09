import { useEffect, useRef } from 'react';
import { api } from '../services/api';

/**
 * Custom React Hook to subscribe to Live Server-Sent Events.
 * Subscribes ONCE per mount (callback goes through a ref) so re-renders
 * never tear down and rebuild the EventSource (no reconnect storms).
 */
export function useSSE(onEvent) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!handlerRef.current) return undefined;
    const sseConnection = api.subscribeToEvents((event) => {
      try {
        handlerRef.current?.(event);
      } catch (e) {
        console.error('SSE handler error:', e);
      }
    });

    return () => {
      if (sseConnection) {
        try { sseConnection.close(); } catch { /* already closed */ }
      }
    };
  }, []);
}

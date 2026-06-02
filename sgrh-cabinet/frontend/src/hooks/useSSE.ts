import { useEffect, useRef } from 'react';

type SSEHandler = (eventName: string, data: unknown) => void;

export function useSSE(url: string, onEvent: SSEHandler): void {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    let es: EventSource;
    let retryTimer: ReturnType<typeof setTimeout>;
    let retryDelay = 3000;

    const connect = () => {
      es = new EventSource(url, { withCredentials: true });

      es.addEventListener('connected', () => {
        retryDelay = 3000; // reset backoff on successful connect
      });

      es.addEventListener('notification', (e: MessageEvent) => {
        try {
          handlerRef.current('notification', JSON.parse(e.data));
        } catch { /* ignore parse errors */ }
      });

      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 30000); // exponential backoff up to 30s
          connect();
        }, retryDelay);
      };
    };

    connect();

    return () => {
      clearTimeout(retryTimer);
      es?.close();
    };
  }, [url]);
}

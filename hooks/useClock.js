import { useState, useEffect } from 'react';

/**
 * Hook que fornece o tempo atual atualizado a cada 100ms.
 * Usado para relógios em tempo real e countdown.
 */
export function useClock(intervalMs = 100) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return currentTime;
}

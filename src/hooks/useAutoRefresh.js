import { useState, useEffect } from 'react';

/** Kontrol Merkezi — arka planda sayfa yenileme aralığı */
export const DASHBOARD_REFRESH_MS = 2 * 60 * 1000;

/**
 * Belirli aralıklarla artan tick döner; useEffect bağımlılığı olarak kullanılır.
 * Sekme görünür değilken tick artmaz (gereksiz istek önlenir).
 */
export function useAutoRefresh(intervalMs = DASHBOARD_REFRESH_MS) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTick((t) => t + 1);
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
}

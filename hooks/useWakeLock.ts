
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to request and maintain a Screen Wake Lock.
 * Prevents the screen from turning off while the condition is met.
 */
export const useWakeLock = (enabled: boolean) => {
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('WAKE LOCK: Ativo - A tela não irá apagar.');
        
        wakeLockRef.current.addEventListener('release', () => {
          console.log('WAKE LOCK: Liberado.');
          wakeLockRef.current = null;
        });
      } catch (err: any) {
        console.error(`WAKE LOCK ERROR: ${err.name}, ${err.message}`);
      }
    } else {
      console.warn('WAKE LOCK: Não suportado neste navegador.');
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      requestWakeLock();
      
      // Re-solicitar se a página voltar a ficar visível (o Wake Lock é perdido ao minimizar)
      const handleVisibilityChange = () => {
        if (enabled && document.visibilityState === 'visible' && !wakeLockRef.current) {
          requestWakeLock();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        releaseWakeLock();
      };
    } else {
      releaseWakeLock();
    }
  }, [enabled, requestWakeLock, releaseWakeLock]);

  return { requestWakeLock, releaseWakeLock };
};

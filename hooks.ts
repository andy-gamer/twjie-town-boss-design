
import { useEffect, useRef, useCallback } from 'react';

// --- INPUT HOOK ---
export function useInput() {
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
}

// --- GAME LOOP HOOK ---
export function useGameLoop(callback: (time: number) => void) {
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const loop = useCallback((time: number) => {
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;
    callback(time);
    requestRef.current = requestAnimationFrame(loop);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loop]);
}

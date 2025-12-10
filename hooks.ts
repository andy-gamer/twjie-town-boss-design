
import { useEffect, useRef, useCallback } from 'react';

// --- INPUT HOOK WITH GAMEPAD SUPPORT ---
export function useInput() {
  const keys = useRef<Set<string>>(new Set());
  const requestRef = useRef<number>(0);

  // Helper to know if keyboard is holding a key
  const keyIsHeldByKeyboard = (k: string) => false; 

  // Gamepad Polling Loop
  const loopCallback = useRef<() => void>(null!);

  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    // We only check the first connected gamepad
    const gp = gamepads[0];
    
    if (gp) {
        // --- BUTTON MAPPING ---
        
        const updateKey = (condition: boolean, key: string) => {
            if (condition) keys.current.add(key);
            else if (!condition && !keyIsHeldByKeyboard(key)) keys.current.delete(key);
        };
        
        // Standard Gamepad Mapping
        updateKey(gp.buttons[0]?.pressed, 'e'); // Interact (A/South)
        updateKey(gp.buttons[1]?.pressed, 'f'); // Flashlight (B/East)
        updateKey(gp.buttons[2]?.pressed, 'q'); // Reveal (X/West)
        updateKey(gp.buttons[3]?.pressed, ' '); // Space/High Beam (Y/North)
        updateKey(gp.buttons[5]?.pressed, ' '); // Space/High Beam (RB)
        updateKey(gp.buttons[6]?.pressed, 'shift'); // Left Trigger for Crouch/Stealth
        updateKey(gp.buttons[4]?.pressed, 'shift'); // LB for Crouch/Stealth
        
        // Movement (D-Pad)
        updateKey(gp.buttons[14]?.pressed, 'arrowleft');
        updateKey(gp.buttons[15]?.pressed, 'arrowright');
        updateKey(gp.buttons[12]?.pressed, 'arrowup');
        updateKey(gp.buttons[13]?.pressed, 'arrowdown');

        // Movement (Analog Stick - Axes 0/1)
        const deadzone = 0.5;
        updateKey(gp.axes[0] < -deadzone, 'a');
        updateKey(gp.axes[0] > deadzone, 'd');
        updateKey(gp.axes[1] < -deadzone, 'w');
        updateKey(gp.axes[1] > deadzone, 's');
    }
    
    requestRef.current = requestAnimationFrame(loopCallback.current);
  }, []);

  useEffect(() => {
      loopCallback.current = pollGamepad;
  }, [pollGamepad]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    requestRef.current = requestAnimationFrame(loopCallback.current);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
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



import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Skull, Heart, Leaf } from 'lucide-react';
import { GameState, RoomId, PlayerState, BossState, Entity, RoomData } from './types';
import { ROOMS, ITEMS, PLAYER_SPEED, SPRINT_SPEED, CROUCH_SPEED, JUMP_FORCE, GRAVITY, SCREEN_WIDTH, SCREEN_HEIGHT, MAX_BATTERY, MAX_STAMINA, BATTERY_DRAIN_NORMAL, BATTERY_DRAIN_HIGH, BATTERY_RECHARGE_RATE, STAMINA_DRAIN_RATE, STAMINA_RECHARGE_RATE } from './data';
import { useInput, useGameLoop } from './hooks';
import { WorldRenderer } from './components/World';
import { HUD, DialogueBox } from './components/UI';
import { updateBossLogic } from './bossAI';

// --- AUDIO UTILS ---
const playSound = (type: 'door_open' | 'door_locked' | 'item_pickup' | 'switch' | 'damage' | 'boss_hit' | 'jump' | 'boss_spotted') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'door_locked') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'door_open') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.4);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'item_pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'switch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'damage') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'boss_hit') {
        // Higher pitched screech for effective hit
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'boss_spotted') {
        // Subtle, unsettling low dissonance
        const osc2 = ctx.createOscillator();
        osc2.connect(gain);
        
        osc.type = 'sine';
        osc2.type = 'triangle';
        
        // Dissonant low frequencies
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.linearRampToValueAtTime(55, now + 1.5);
        
        osc2.frequency.setValueAtTime(67, now); // Minor second-ish clash
        osc2.frequency.linearRampToValueAtTime(65, now + 1.5);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.2); // Fade in
        gain.gain.linearRampToValueAtTime(0, now + 2.0); // Long fade out

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 2.0);
        osc2.stop(now + 2.0);
    }
};

const INITIAL_PLAYER_STATE: PlayerState = {
    room: RoomId.BUS_STOP,
    x: 100, y: 450, z: 0,
    vx: 0, vy: 0, vz: 0,
    w: 40, h: 80,
    facingRight: true,
    aimAngle: 0,
    inventory: [],
    health: 100,
    sanity: 100,
    flashlightOn: false,
    isCrouching: false,
    battery: MAX_BATTERY,
    stamina: MAX_STAMINA,
};

const INITIAL_BOSS_STATE: BossState = {
    active: false,
    phase: 1,
    health: 100,
    x: 800, y: 250, 
    stunned: false,
    stunTimer: 0,
    lastHit: 0,
    aiState: 'IDLE',
    stateTimer: 60,
    vineAttack: { active: false, targetX: 0, targetY: 0, progress: 0 },
    mutterText: null,
    mutterTimer: 0
};

// MOVEMENT PHYSICS
const FRICTION = 0.8;
const ACCELERATION = 0.8;
const MIN_VELOCITY = 0.1;

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [player, setPlayer] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [boss, setBoss] = useState<BossState>(INITIAL_BOSS_STATE);
  
  const [dialogue, setDialogue] = useState<string[] | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  
  const [isCutscene, setIsCutscene] = useState(false);
  const [cameraOverride, setCameraOverride] = useState<number | null>(null);
  const [introStep, setIntroStep] = useState(0); 
  
  const [isRevealing, setIsRevealing] = useState(false); // Q Toggle
  
  const [thought, setThought] = useState<string | null>(null);
  const thoughtTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedTriggers = useRef<Set<string>>(new Set());
  
  const [isDistorting, setIsDistorting] = useState(false);
  const [screenShake, setScreenShake] = useState(0);
  
  const [flickerIntensity, setFlickerIntensity] = useState(0);
  
  const bossDeathTimerRef = useRef<number | null>(null);
  
  // Fullscreen Scaling
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      // Calculate scale to fit window while maintaining aspect ratio or covering
      const s = Math.min(window.innerWidth / SCREEN_WIDTH, window.innerHeight / SCREEN_HEIGHT);
      setScale(s);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HOOKS ---
  const keys = useInput();
  
  // Derived Inputs
  const isHighBeam = keys.current.has(' '); // SPACE key for High Beam
  const isCrouchHeld = keys.current.has('shift'); // SHIFT key for Crouch/Stealth
  const isMoving = Math.abs(player.vx) > 0.5; // Only X movement counts

  // --- PROGRESSION LOGIC ---
  const isDoorLocked = useCallback((doorId: string) => false, []);

  const showThought = useCallback((text: string) => {
      if (thoughtTimeoutRef.current) clearTimeout(thoughtTimeoutRef.current);
      setThought(text);
      thoughtTimeoutRef.current = setTimeout(() => setThought(null), 4000);
  }, []);

  // --- RESET FUNCTION ---
  const resetGame = useCallback(() => {
      setGameState(GameState.INTRO);
      setPlayer(INITIAL_PLAYER_STATE);
      setBoss(INITIAL_BOSS_STATE);
      setIntroStep(0);
      setDialogue(null);
      setDialogueIndex(0); 
      setIsCutscene(false);
      setCameraOverride(null);
      setIsRevealing(false);
      setIsDistorting(false);
      setScreenShake(0);
      setFlickerIntensity(0);
      processedTriggers.current.clear();
      setThought(null);
      bossDeathTimerRef.current = null;
  }, []);

  const startDebugBossFight = useCallback(() => {
     setIsCutscene(false);
     setCameraOverride(null);
     setIsRevealing(false);
     setDialogue(null);
     setDialogueIndex(0);
     
     setPlayer({
         ...INITIAL_PLAYER_STATE,
         room: RoomId.LOBBY,
         x: 600, 
         y: 480, 
         vx: 0, vy: 0,
         inventory: [ITEMS.YEARBOOK, ITEMS.SHARD_TROPHY, ITEMS.SHARD_TOY, ITEMS.BELT_BUCKLE, ITEMS.DIARY_PAGE],
         flashlightOn: true,
         battery: MAX_BATTERY,
         health: 100,
         stamina: MAX_STAMINA
     });
     
     setBoss({
        active: true,
        phase: 1,
        health: 100,
        x: 800, 
        y: 250, 
        stunned: false,
        stunTimer: 0,
        lastHit: 0,
        aiState: 'WANDER', // Start dormant
        stateTimer: 60,
        vineAttack: { active: false, targetX: 0, targetY: 0, progress: 0 },
        mutterText: null,
        mutterTimer: 0
     });
     
     setIntroStep(3); 
     setGameState(GameState.BOSS_FIGHT);
     
     setTimeout(() => {
         setDialogue([
             "【測試模式】BOSS戰",
             "怪物具有「趨光性」。不開燈時它會漫無目的遊蕩。",
             "開燈後它會迅速追擊。",
             "按住 [Space] 強力光束會自動瞄準怪物核心。",
             "按 [Shift] 蹲下移動，可以避免發出聲音。"
         ]);
     }, 100);
  }, []);

  // --- INTRO CUTSCENE LOGIC ---
  useEffect(() => {
    if (gameState === GameState.INTRO && introStep === 1) {
      const timer = setTimeout(() => setIntroStep(2), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, introStep]);

  useEffect(() => {
    const triggerId = 'lobby_cutscene_initial';
    if (player.room === RoomId.LOBBY && !processedTriggers.current.has(triggerId) && gameState === GameState.EXPLORATION) {
        processedTriggers.current.add(triggerId);
        setIsCutscene(true);
        setCameraOverride(0);

        let panProgress = 0;
        let waiting = false;
        let panningBack = false;

        const panInterval = setInterval(() => {
            if (waiting) return;

            if (!panningBack) {
                panProgress += 10;
                if (panProgress >= 450) {
                    waiting = true;
                    setCameraOverride(450);
                    setTimeout(() => {
                         showThought("手電筒...照到了什麼東西？");
                         setTimeout(() => {
                            waiting = false;
                            panningBack = true;
                         }, 2000);
                    }, 500);
                } else {
                    setCameraOverride(panProgress);
                }
            } else {
                panProgress -= 15;
                if (panProgress <= 0) {
                    clearInterval(panInterval);
                    setCameraOverride(0);
                    setTimeout(() => {
                        setDialogue([
                            "那孩子... 跑到舞台上了？",
                            "（舞台中間的紅布幕後，隱約有個人影。）",
                            "我得過去看看。"
                        ]);
                    }, 300);
                } else {
                     setCameraOverride(panProgress);
                }
            }
        }, 16);
    }
  }, [player.room, showThought, gameState]);

  useEffect(() => {
      const triggerId = 'lobby_cutscene_initial';
      if (processedTriggers.current.has(triggerId) && isCutscene && !dialogue) {
          setIsCutscene(false);
          setCameraOverride(null); 
      }
  }, [dialogue, isCutscene]);


  const update = useCallback((time: number) => {
    if (dialogue) return; 
    
    if (screenShake > 0) {
        setScreenShake(s => Math.max(0, s - 1));
    }

    // --- STRESS CALCULATION ---
    let stress = 0;
    if (player.health < 50) stress += 0.2;
    if (boss.active && boss.health > 0) {
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 400) stress += 0.1;
    }
    if (isRevealing) stress += 0.1;
    // Cap flicker intensity to avoid epilepsy/annoyance
    setFlickerIntensity(Math.min(0.4, stress));

    // Intro Cutscene Updates
    if (gameState === GameState.INTRO && player.room === RoomId.BUS_STOP) {
         if (introStep === 2) {
             const shadowBoy = ROOMS[RoomId.BUS_STOP].entities.find(e => e.id === 'shadow_boy_intro');
             if (shadowBoy) {
                 shadowBoy.x += 6;
                 if (shadowBoy.x > 750) {
                     shadowBoy.visibleInNormal = false;
                     shadowBoy.visibleInReveal = false;
                     setIntroStep(3);
                     setDialogue([
                         "等等！那是... 家豪？",
                         "（為什麼他會出現在這裡？）",
                         "（按 [F] 開啟手電筒，按 [Space] 使用強力光束燒灼。）",
                         "（按 [Shift] 蹲下潛行，避免發出聲音。）"
                     ]);
                     setPlayer(p => ({...p, flashlightOn: true}));
                 }
             }
         }
         if (introStep < 3) return;
    }

    if (isCutscene) return; 

    // -- Battery & Stamina --
    setPlayer(prev => {
        let newBattery = prev.battery;
        let newStamina = prev.stamina;

        if (prev.flashlightOn && isHighBeam) {
            newBattery = Math.max(0, prev.battery - BATTERY_DRAIN_HIGH);
        } else {
            newBattery = Math.min(MAX_BATTERY, prev.battery + BATTERY_RECHARGE_RATE);
        }
        
        // MOVEMENT SPEED LOGIC
        let speed = PLAYER_SPEED;
        if (isCrouchHeld) {
            speed = CROUCH_SPEED;
        } else {
            newStamina = Math.min(MAX_STAMINA, prev.stamina + STAMINA_RECHARGE_RATE);
        }

        // --- INPUT PHYSICS ---
        let inputX = 0;
        let aimInput = 0;

        if (keys.current.has('a') || keys.current.has('arrowleft')) inputX -= 1;
        if (keys.current.has('d') || keys.current.has('arrowright')) inputX += 1;
        
        if (keys.current.has('w') || keys.current.has('arrowup')) aimInput -= 1; // Up angles up (negative deg)
        if (keys.current.has('s') || keys.current.has('arrowdown')) aimInput += 1; // Down angles down (positive deg)

        let newVx = prev.vx;

        if (inputX !== 0) newVx += inputX * ACCELERATION;
        if (inputX === 0) newVx *= FRICTION;

        const currentSpeed = Math.abs(newVx);
        if (currentSpeed > speed) {
            const ratio = speed / currentSpeed;
            newVx *= ratio;
        }

        if (Math.abs(newVx) < MIN_VELOCITY) newVx = 0;

        // AIMING LOGIC
        let newAimAngle = prev.aimAngle;
        
        // AUTO-AIM when using High Beam and Boss is active
        if (isHighBeam && boss.active && boss.health > 0) {
            // Calculate angle to boss core (roughly center of body)
            // Boss body center is approx boss.x + 30, boss.y - 40 (relative to foot position y)
            // Player beam source is approx player.x + 20, player.y - 40
            const bossCenterX = boss.x + 30;
            const bossCenterY = boss.y - 40;
            const playerCenterX = prev.x + prev.w / 2;
            const playerCenterY = prev.y - 70; // Approximation of head height
            
            const dx = bossCenterX - playerCenterX;
            const dy = bossCenterY - playerCenterY;
            
            // Calculate angle in degrees
            let angle = Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI);
            
            // Clamp angle to reasonable limits for flashlight (-60 to 60)
            angle = Math.max(-60, Math.min(60, angle));
            
            newAimAngle = angle;
        } else {
            // Manual Aiming when not locked on
            if (aimInput !== 0) {
                newAimAngle += aimInput * 3; // Faster aiming
            } else if (aimInput === 0) {
                 // Slowly return to neutral 0 if not holding aim
                 if (newAimAngle > 0) newAimAngle = Math.max(0, newAimAngle - 2);
                 if (newAimAngle < 0) newAimAngle = Math.min(0, newAimAngle + 2);
            }
            newAimAngle = Math.max(-45, Math.min(45, newAimAngle));
        }

        // --- GRAVITY/JUMP PHYSICS (JUMP DISABLED) ---
        let newZ = prev.z;
        let newVz = prev.vz;

        // Gravity still applies if falling from stage
        if (newZ > 0 || newVz > 0) {
            newVz -= GRAVITY;
            newZ += newVz;
            if (newZ < 0) {
                newZ = 0;
                newVz = 0;
            }
        }

        let nextX = prev.x + newVx;
        // Restrict Y movement to physics/gravity only (falling off stage), no user input for Y
        let nextY = prev.y; 
        
        let nextFacing = prev.facingRight;
        // Auto-face boss if high beaming
        if (isHighBeam && boss.active && boss.health > 0) {
             if (boss.x > prev.x) nextFacing = true;
             else if (boss.x < prev.x) nextFacing = false;
        } else {
            // Standard movement facing
            if (inputX < 0) nextFacing = false;
            if (inputX > 0) nextFacing = true;
        }

        const room = ROOMS[prev.room];
        if (nextX < 0) { nextX = 0; newVx = 0; }
        if (nextX > room.width - prev.w) { nextX = room.width - prev.w; newVx = 0; }

        // Vertical floor collisions (Simple)
        const minY = 200; 
        const maxY = room.height - prev.h; 
        if (nextY < minY) { nextY = minY; }
        if (nextY > maxY) { nextY = maxY; }

        // TRAP COLLISION
        let healthDamage = 0;
        if (prev.z === 0) { // Only hit traps if on ground
            room.entities.forEach(e => {
                if (e.type === 'trap') {
                    const pCX = nextX + prev.w/2;
                    const pCY = nextY + prev.h;
                    const eCX = e.x + e.w/2;
                    const eCY = e.y + e.h;
                    if (Math.abs(pCX - eCX) < e.w/2 && Math.abs(pCY - eCY) < 20) {
                        healthDamage += 0.5;
                        setScreenShake(5);
                        playSound('damage');
                    }
                }
            });
        }
        
        return { 
            ...prev, 
            x: nextX, 
            y: nextY,
            z: newZ, 
            vx: newVx,
            vy: 0, // No Y velocity from input
            vz: newVz,
            facingRight: nextFacing,
            aimAngle: newAimAngle,
            isCrouching: isCrouchHeld,
            battery: newBattery,
            stamina: newStamina,
            health: Math.max(0, prev.health - healthDamage)
        };
    });

    // -- Boss Logic --
    if (gameState === GameState.BOSS_FIGHT && boss.active) {
        if (boss.health > 0) {
             setBoss(prev => updateBossLogic(
                prev, 
                player, 
                player.flashlightOn, 
                isHighBeam, 
                setGameState, 
                setPlayer,
                () => { // onHit callback
                    playSound('boss_hit');
                    setScreenShake(8);
                },
                () => { // onDetect callback
                    playSound('boss_spotted');
                }
            ));
        } else {
             if (!bossDeathTimerRef.current) {
                 setScreenShake(20);
                 bossDeathTimerRef.current = window.setTimeout(() => {
                     setGameState(GameState.ENDING_WITHER);
                 }, 2000); 
             }
        }
    }
    
    if ((gameState === GameState.BOSS_FIGHT || gameState === GameState.EXPLORATION) && player.health <= 0) {
        setGameState(GameState.ENDING_COCOON);
    }

  }, [gameState, dialogue, boss, introStep, isRevealing, isHighBeam, keys, isMoving, isCrouchHeld, isCutscene, player.room, player.flashlightOn, player.health, screenShake, player.x, player.y, player.vx, player.vy, player.z, player.vz]);


  useGameLoop(update);

  // --- CONTROLS ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          
          if (key === 'p' && e.shiftKey) {
              startDebugBossFight();
              return;
          }
          
          if (dialogue) {
               if (key === 'e' || key === 'enter' || key === ' ') {
                   handleDialogueAdvance();
               }
               return;
          }

          if (key === 'q') {
             setIsRevealing(prev => !prev);
             playSound('switch');
          }
          if (key === 'f') {
             setPlayer(p => ({ ...p, flashlightOn: !p.flashlightOn }));
             playSound('switch');
          }
          if (key === 'e') {
              handleInteraction();
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player.inventory, player.battery, player.room, gameState, dialogue, boss, dialogueIndex, startDebugBossFight]);


  const handleDialogueAdvance = () => {
    if (dialogue) {
        if (dialogueIndex < dialogue.length - 1) {
            setDialogueIndex(i => i + 1);
        } else {
            setDialogue(null);
            setDialogueIndex(0);
            
            if (player.inventory.includes(ITEMS.YEARBOOK) && (gameState === GameState.INTRO || gameState === GameState.EXPLORATION)) {
                setIsDistorting(true);
                showThought("不... 頭好痛...");
                setTimeout(() => {
                    setGameState(GameState.CORRUPTED);
                    setIsDistorting(false); 
                }, 2000);
            }
        }
    }
  };

  const handleInteraction = () => {
    const room = ROOMS[player.room];
    const candidates = room.entities.filter(e => {
        if (e.type === 'item' && player.inventory.includes(e.id)) return false;
        
        const isVisible = (e.visibleInNormal && !isRevealing) || 
                          (e.visibleInReveal && isRevealing) || 
                          (e.visibleInNormal && e.visibleInReveal);
        if (!isVisible) return false;

        const dx = (player.x + player.w/2) - (e.x + e.w/2);
        const dy = (player.y + player.h/2) - (e.y + e.h/2);
        return Math.sqrt(dx*dx + dy*dy) < 100;
    });

    if (candidates.length === 0) return;

    candidates.sort((a, b) => {
        const distA = Math.hypot((player.x + player.w/2) - (a.x + a.w/2), (player.y + player.h/2) - (a.y + a.h/2));
        const distB = Math.hypot((player.x + player.w/2) - (b.x + b.w/2), (player.y + player.h/2) - (b.y + b.h/2));
        const getPriority = (type: string) => {
            if (type === 'item' || type === 'boss_altar') return 1;
            if (type === 'npc' || type === 'decoration') return 2;
            return 3;
        };
        return getPriority(a.type) - getPriority(b.type) || distA - distB;
    });

    const target = candidates[0];

    if (target.type === 'stairs' && target.targetY) {
        setPlayer(p => ({ ...p, y: target.targetY! }));
        playSound('door_open');
        return;
    }

    if (target.type === 'door' && target.targetRoom) {
        if (isDoorLocked(target.id)) {
            playSound('door_locked');
        } else {
            playSound('door_open');
            let targetX = target.targetX || 100;
            setPlayer(p => ({...p, room: target.targetRoom!, x: targetX, vx: 0, vy: 0}));
            if (gameState === GameState.INTRO && target.targetRoom === RoomId.LOBBY) {
                setGameState(GameState.EXPLORATION);
            }
        }
    } 
    else if (target.type === 'item') {
        if (!player.inventory.includes(target.id)) {
            playSound('item_pickup');
            setPlayer(p => ({ ...p, inventory: [...p.inventory, target.id] }));
            if (target.dialogue) setDialogue(target.dialogue);
        }
    }
    else if (target.id === 'boss_altar') {
        const required = [ITEMS.SHARD_TROPHY, ITEMS.SHARD_TOY, ITEMS.BELT_BUCKLE, ITEMS.DIARY_PAGE];
        const collected = required.filter(i => player.inventory.includes(i));
        
        if (collected.length >= 4 && player.inventory.includes(ITEMS.YEARBOOK)) {
                setGameState(GameState.BOSS_FIGHT);
                setBoss(b => ({
                    ...b, 
                    active: true, 
                    health: 100, 
                    x: 800, 
                    y: 250, 
                    aiState: 'WANDER', 
                    stateTimer: 60,
                    vineAttack: { active: false, targetX: 0, targetY: 0, progress: 0 }
                }));
                setDialogue([
                    "【最終決戰】",
                    "光是你唯一的武器。",
                    "1. 按住 [Space] 強力光束會自動瞄準怪物核心。",
                    "2. 蹲下 [Shift] 潛行可以減少被發現的機會。",
                    "3. 保持距離，注意躲避藤蔓攻擊！"
                ]);
        } else {
             setDialogue([
                "祭壇上需要獻上四個記憶碎片以及關鍵的「畢業紀念冊」。"
             ]);
        }
    }
    else if (target.dialogue) {
        setDialogue(target.dialogue);
    }
  };

  if (gameState === GameState.INTRO && player.room === RoomId.BUS_STOP && introStep === 0) {
      return (
          <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white space-y-8 z-50 overflow-hidden relative">
              <div className="scanlines w-full h-full absolute top-0 left-0" />
              <h1 className="text-7xl font-serif text-red-700 tracking-[0.5em] crt-flicker relative z-10 border-y-2 border-red-900/50 py-4">故人之夢</h1>
              <p className="text-xl text-gray-400 font-serif tracking-widest relative z-10">第一章：大禮堂</p>
               <button onClick={() => setIntroStep(1)} className="px-10 py-4 border border-red-800 hover:bg-red900/20 hover:border-red-500 transition-all text-red-500 mt-8 relative z-10 tracking-[0.2em] cursor-pointer">
                  開始旅程 START
              </button>
               <button onClick={startDebugBossFight} className="px-6 py-2 bg-purple-900/20 border border-purple-500/50 hover:bg-purple-900/40 hover:border-purple-400 transition-all text-purple-300 mt-4 relative z-10 tracking-[0.1em] cursor-pointer text-sm font-bold shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  [DEBUG] 直達 BOSS 戰
              </button>
          </div>
      );
  }

  if (gameState === GameState.ENDING_WITHER) {
      return (
          <div className="w-screen h-screen bg-[#f0f0f0] flex flex-col items-center justify-center text-black p-10 text-center relative">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white,transparent)] opacity-50" />
              <Leaf size={80} className="mb-6 text-gray-400" />
              <h2 className="text-5xl font-bold mb-6 font-serif tracking-widest text-gray-800">結局 A：枯萎</h2>
              <p className="text-lg text-gray-700 mb-8 max-w-xl leading-relaxed font-serif">
                  在強光的照射下，黑影如枯葉般碎裂、消散。<br/>
                  他最後的表情似乎是解脫。
              </p>
              <button onClick={resetGame} className="text-black border-b border-black hover:opacity-50 transition-opacity cursor-pointer">重新開始</button>
          </div>
      );
  }

  if (gameState === GameState.ENDING_COCOON) {
      return (
          <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-red-500 p-10 text-center relative overflow-hidden">
              <div className="noise-overlay" style={{opacity: 0.3}} />
              <Skull size={80} className="mb-6 animate-pulse" />
              <h2 className="text-5xl font-bold mb-6 font-serif tracking-widest">結局 B：沈睡</h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed font-serif">
                  你沒有躲過那致命的一擊。<br/>
                  藤蔓溫柔地將你包裹，結成一個巨大的花繭。
              </p>
              <button onClick={resetGame} className="text-white border-b border-transparent hover:border-white transition-colors cursor-pointer">重新開始</button>
          </div>
      );
  }

  const roomWidth = ROOMS[player.room].width;
  const calculatedCameraX = Math.max(0, Math.min(player.x - SCREEN_WIDTH/2, roomWidth - SCREEN_WIDTH));
  const finalCameraX = cameraOverride !== null ? cameraOverride : calculatedCameraX;
  const playerScreenX = (player.x - finalCameraX) + player.w / 2;
  const playerScreenY = player.y;

  return (
    <div 
      className="flex items-center justify-center w-screen h-screen bg-[#050505] select-none overflow-hidden"
      style={{ '--flicker-intensity': flickerIntensity } as React.CSSProperties}
    >
        <div 
            className="relative origin-center" 
            style={{ 
                width: SCREEN_WIDTH, 
                height: SCREEN_HEIGHT,
                transform: `scale(${scale})` // Scale to fit screen
            }}
        >
            <WorldRenderer 
                room={ROOMS[player.room]}
                player={player}
                boss={boss}
                isRevealing={isRevealing}
                isHighBeam={player.flashlightOn && isHighBeam} 
                isCorrupted={gameState === GameState.CORRUPTED || gameState === GameState.BOSS_FIGHT}
                isDistorting={isDistorting}
                thought={thought}
                isMoving={isMoving}
                cameraX={finalCameraX}
                isDoorLocked={isDoorLocked}
                screenShake={screenShake}
            />
            {introStep >= 3 && (
                <HUD 
                    roomName={ROOMS[player.room].name}
                    isRevealing={isRevealing}
                    isHighBeam={isHighBeam}
                    inventory={player.inventory}
                    boss={boss}
                    objective={player.battery <= 0 ? "沒電了！注意躲避！" : "探索校園，尋找真相"}
                    battery={player.battery}
                    stamina={player.stamina}
                    player={player} 
                />
            )}
            {dialogue && (
                <DialogueBox text={dialogue[dialogueIndex]} position={{ x: playerScreenX, y: playerScreenY }} />
            )}
            <div className="global-flicker-overlay" />
        </div>
    </div>
  );
}
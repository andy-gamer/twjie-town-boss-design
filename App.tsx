
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Skull, Heart } from 'lucide-react';
import { GameState, RoomId, PlayerState, BossState, Entity, RoomData } from './types';
import { ROOMS, ITEMS, PLAYER_SPEED, SPRINT_SPEED, CROUCH_SPEED, ATTACK_DAMAGE_BASE, ATTACK_COOLDOWN, SCREEN_WIDTH, SCREEN_HEIGHT, MAX_BATTERY, MAX_STAMINA, BATTERY_DRAIN_NORMAL, BATTERY_DRAIN_HIGH, BATTERY_RECHARGE_RATE, STAMINA_DRAIN_RATE, STAMINA_RECHARGE_RATE } from './data';
import { useInput, useGameLoop } from './hooks';
import { WorldRenderer, HUD, DialogueBox } from './components';
import { updateBossLogic } from './bossAI';

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [player, setPlayer] = useState<PlayerState>({
    room: RoomId.BUS_STOP,
    x: 100, y: 450, w: 40, h: 80,
    facingRight: true,
    inventory: [],
    health: 100,
    sanity: 100,
    
    // Mechanics
    flashlightOn: false, // Default OFF
    battery: MAX_BATTERY,
    stamina: MAX_STAMINA,
    
    // RPG Stats
    strength: 1,
    stealth: 1,
    
    // Actions
    isCrouching: false,
    isAttacking: false
  });

  const [boss, setBoss] = useState<BossState>({
    active: false,
    phase: 1,
    health: 100,
    x: 600, y: 350, 
    stunned: false,
    stunTimer: 0
  });
  
  const [dialogue, setDialogue] = useState<string[] | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  
  // Cutscene & Camera State
  const [isCutscene, setIsCutscene] = useState(false);
  const [cameraOverride, setCameraOverride] = useState<number | null>(null);
  const [introStep, setIntroStep] = useState(0); 
  
  // Mechanics State
  const [isRevealing, setIsRevealing] = useState(false); // Q Toggle
  const attackCooldownRef = useRef(0);
  
  // Floating thought bubble state
  const [thought, setThought] = useState<string | null>(null);
  const thoughtTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedTriggers = useRef<Set<string>>(new Set());
  
  // Visual Effects
  const [isDistorting, setIsDistorting] = useState(false);

  // --- HOOKS ---
  const keys = useInput();
  
  // Derived Inputs
  const isHighBeam = keys.current.has(' '); // Spacebar boost
  const isSprinting = keys.current.has('shift'); 
  const isMoving = keys.current.has('w') || keys.current.has('a') || keys.current.has('s') || keys.current.has('d') ||
                   keys.current.has('arrowup') || keys.current.has('arrowleft') || keys.current.has('arrowdown') || keys.current.has('arrowright');

  // --- PROGRESSION LOGIC ---
  const isDoorLocked = useCallback((doorId: string) => {
      const invCount = player.inventory.length; 
      // Logic for inventory based locking...
      if (doorId === 'to_hall_left') return false; 
      
      // Barricaded doors removed from this logic as they are now 'breakable' entities
      
      // Story locks
      if (doorId === 'stairs_up_l') return invCount < 2;
      if (doorId === 'stairs_up_r') return invCount < 3;
      if (doorId === 'to_sound_sl' || doorId === 'to_sound_sr') return invCount < 4;

      return false;
  }, [player.inventory]);

  const showThought = useCallback((text: string) => {
      if (thoughtTimeoutRef.current) clearTimeout(thoughtTimeoutRef.current);
      setThought(text);
      thoughtTimeoutRef.current = setTimeout(() => setThought(null), 4000);
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
    if (player.room === RoomId.LOBBY && !processedTriggers.current.has(triggerId)) {
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
  }, [player.room, showThought]);

  useEffect(() => {
      const triggerId = 'lobby_cutscene_initial';
      if (processedTriggers.current.has(triggerId) && isCutscene && !dialogue) {
          setIsCutscene(false);
          setCameraOverride(null); 
      }
  }, [dialogue, isCutscene]);


  const update = useCallback((time: number) => {
    if (dialogue) return; 

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
                         "（按 [F] 開啟手電筒，按 [C] 蹲下潛行，按 [K] 攻擊。）"
                     ]);
                     // Auto turn on flashlight for player
                     setPlayer(p => ({...p, flashlightOn: true}));
                 }
             }
         }
         if (introStep < 3) return;
    }

    if (isCutscene) return; 

    // -- Battery & Stamina & Action Logic --
    setPlayer(prev => {
        let newBattery = prev.battery;
        let newStamina = prev.stamina;

        // Battery: Only drains if Flashlight is ON (F). High Beam (Space) drains faster.
        if (prev.flashlightOn) {
            const drain = isHighBeam ? BATTERY_DRAIN_HIGH : BATTERY_DRAIN_NORMAL;
            newBattery = Math.max(0, prev.battery - drain);
        } else {
            // Optional: Slight recharge if off? Or just no drain.
            // newBattery = Math.min(MAX_BATTERY, prev.battery + BATTERY_RECHARGE_RATE);
        }
        
        // Auto turn off if dead battery
        let newFlashlightState = prev.flashlightOn;
        if (newBattery <= 0) newFlashlightState = false;

        // Stamina
        let speed = PLAYER_SPEED;
        
        if (prev.isCrouching) {
            speed = CROUCH_SPEED;
            // Crouching recovers stamina faster
            newStamina = Math.min(MAX_STAMINA, prev.stamina + STAMINA_RECHARGE_RATE * 1.5);
        } else if (isSprinting && isMoving && prev.stamina > 0) {
            newStamina = Math.max(0, prev.stamina - STAMINA_DRAIN_RATE);
            speed = SPRINT_SPEED;
        } else {
            newStamina = Math.min(MAX_STAMINA, prev.stamina + STAMINA_RECHARGE_RATE);
        }

        // Movement
        let dx = 0;
        let dy = 0;

        if (keys.current.has('w') || keys.current.has('arrowup')) dy -= 1;
        if (keys.current.has('s') || keys.current.has('arrowdown')) dy += 1;
        if (keys.current.has('a') || keys.current.has('arrowleft')) dx -= 1;
        if (keys.current.has('d') || keys.current.has('arrowright')) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx*dx + dy*dy);
            dx = (dx / length) * speed;
            dy = (dy / length) * speed * 0.6; 
        }

        let nextX = prev.x + dx;
        let nextY = prev.y + dy;
        let nextFacing = prev.facingRight;
        
        if (dx < 0) nextFacing = false;
        if (dx > 0) nextFacing = true;

        const room = ROOMS[prev.room];
        
        if (nextX < 0) nextX = 0;
        if (nextX > room.width - prev.w) nextX = room.width - prev.w;
        
        const floorTop = 380; 
        const floorBottom = 540; 
        if (nextY < floorTop) nextY = floorTop;
        if (nextY > floorBottom - prev.h) nextY = floorBottom - prev.h;
        
        // Attack Cooldown Management
        if (attackCooldownRef.current > 0) attackCooldownRef.current--;
        let isAttacking = false;
        if (keys.current.has('k') && attackCooldownRef.current === 0) {
            isAttacking = true;
            attackCooldownRef.current = ATTACK_COOLDOWN;
            // Handle Attack Logic (Hit detection)
            handleAttack(prev, room);
        } else if (attackCooldownRef.current > ATTACK_COOLDOWN - 10) {
             isAttacking = true; // Keep visual state for a few frames
        }

        return { 
            ...prev, 
            x: nextX, 
            y: nextY, 
            facingRight: nextFacing,
            battery: newBattery,
            flashlightOn: newBattery <= 0 ? false : prev.flashlightOn, 
            stamina: newStamina,
            isAttacking: isAttacking
        };
    });

    // -- Boss Logic --
    if (gameState === GameState.BOSS_FIGHT && boss.active && boss.health > 0) {
        setBoss(prev => updateBossLogic(prev, player, player.flashlightOn && isHighBeam, isRevealing, setGameState));
    }

  }, [gameState, dialogue, boss.active, boss.health, introStep, isRevealing, isHighBeam, keys, isMoving, isSprinting, isCutscene, player.room]);

  // Handle Attack Logic
  const handleAttack = (p: PlayerState, room: RoomData) => {
      // 1. Check for Breakable Objects
      const hitBox = {
          x: p.facingRight ? p.x + p.w : p.x - 50,
          y: p.y,
          w: 50,
          h: p.h
      };
      
      room.entities.forEach(e => {
          if (e.type === 'breakable' && e.hp && e.hp > 0) {
              // Check collision
              if (hitBox.x < e.x + e.w && hitBox.x + hitBox.w > e.x &&
                  hitBox.y < e.y + e.h && hitBox.y + hitBox.h > e.y) {
                  
                  e.hp -= (ATTACK_DAMAGE_BASE + p.strength * 5);
                  showThought("攻擊！");
                  
                  if (e.hp <= 0) {
                      // Destroyed
                      e.visibleInNormal = false;
                      e.visibleInReveal = false;
                      showThought("障礙物被破壞了！");
                  } else {
                      showThought("還差一點...");
                  }
              }
          }
      });
      
      // 2. Check for Boss (Combat Strategy)
      if (gameState === GameState.BOSS_FIGHT && boss.active) {
          const dx = Math.abs((p.x + p.w/2) - boss.x);
          const dy = Math.abs((p.y + p.h/2) - boss.y);
          if (dx < 100 && dy < 100) {
               setBoss(b => ({
                   ...b, 
                   health: b.health - (2 + p.strength), // Physical damage
                   stunned: true,
                   stunTimer: 20
               }));
          }
      }
  };

  useGameLoop(update);

  // --- CONTROLS ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          
          if (dialogue) {
               // Skip dialogue
               if (key === 'e' || key === 'enter' || key === ' ') {
                   handleInteraction();
               }
               return;
          }

          if (key === 'q') {
             setIsRevealing(prev => !prev);
          }
          if (key === 'f') {
             setPlayer(p => {
                 if (p.battery <= 0) {
                     showThought("沒電了...");
                     return p;
                 }
                 return { ...p, flashlightOn: !p.flashlightOn };
             });
          }
          if (key === 'c') {
              setPlayer(p => ({ ...p, isCrouching: !p.isCrouching }));
          }
          if (key === 'e') {
              handleInteraction();
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player.inventory, player.battery, player.room, gameState, dialogue, boss, dialogueIndex]);


  const handleInteraction = () => {
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
        return;
    }

    const room = ROOMS[player.room];
    const candidates = room.entities.filter(e => {
        if (e.type === 'item' && player.inventory.includes(e.id)) return false;
        if (e.type === 'breakable' && (!e.hp || e.hp <= 0)) return false;
        
        const isVisible = (e.visibleInNormal && !isRevealing) || 
                          (e.visibleInReveal && isRevealing) || 
                          (e.visibleInNormal && e.visibleInReveal);
        if (!isVisible) return false;

        const dx = (player.x + player.w/2) - (e.x + e.w/2);
        const dy = (player.y + player.h/2) - (e.y + e.h/2);
        return Math.sqrt(dx*dx + dy*dy) < 100;
    });

    if (candidates.length === 0) return;

    // Find closest
    candidates.sort((a, b) => {
        const distA = Math.hypot((player.x + player.w/2) - (a.x + a.w/2), (player.y + player.h/2) - (a.y + a.h/2));
        const distB = Math.hypot((player.x + player.w/2) - (b.x + b.w/2), (player.y + player.h/2) - (b.y + b.h/2));
        return distA - distB;
    });

    const nearby = candidates[0];

    // --- INTERACTION HANDLERS ---
    
    // 1. Breakable (Feedback if E pressed instead of K)
    if (nearby.type === 'breakable') {
        showThought("這看起來很脆弱，也許可以用力(K)打破它。");
        return;
    }

    // 2. Vent (Requires Crouching)
    if (nearby.type === 'vent') {
        if (!player.isCrouching) {
            showThought("太窄了，我得蹲下(C)才能進去。");
            return;
        }
        if (nearby.targetRoom) {
             setPlayer(p => ({...p, room: nearby.targetRoom!, x: nearby.targetX || 100}));
             showThought("爬過通風口...");
        }
        return;
    }

    // 3. Doors
    if (nearby.type === 'door' && nearby.targetRoom) {
        // Locked Logic
        if (isDoorLocked(nearby.id)) {
            // Special case: Barricades handled by 'breakable' type now, but if there's a logic lock:
             setDialogue([
                "這扇門被黑色的藤蔓封鎖了。",
                "（必須解開心結才能通過。）"
            ]);
            return;
        }

        let targetX = nearby.targetX || 100;
        setPlayer(p => ({...p, room: nearby.targetRoom!, x: targetX}));
        
        if (gameState === GameState.INTRO && nearby.targetRoom === RoomId.LOBBY) {
            setGameState(GameState.EXPLORATION);
        }
    } 
    // 4. Items (Stats Upgrades)
    else if (nearby.type === 'item') {
        if (!player.inventory.includes(nearby.id)) {
            setPlayer(p => {
                let stats = { ...p, inventory: [...p.inventory, nearby.id] };
                // Apply Stats
                if (nearby.id === ITEMS.DUMBBELL) stats.strength += 1;
                if (nearby.id === ITEMS.SNEAKERS) stats.stealth += 1;
                return stats;
            });
            if (nearby.dialogue) setDialogue(nearby.dialogue);
        }
    }
    // 5. Boss Altar
    else if (nearby.id === 'boss_altar') {
        const required = [ITEMS.SHARD_TROPHY, ITEMS.SHARD_TOY, ITEMS.BELT_BUCKLE, ITEMS.DIARY_PAGE];
        const collected = required.filter(i => player.inventory.includes(i));
        
        if (collected.length >= 4 && player.inventory.includes(ITEMS.YEARBOOK)) {
                setGameState(GameState.BOSS_FIGHT);
                setBoss(b => ({...b, active: true, x: 600, y: 350}));
                setDialogue([
                    "【最終決戰】",
                    "你可以選擇：",
                    "1. 正面迎戰：開啟手電筒(F+Space)照射，或用蠻力(K)攻擊。",
                    "2. 潛行周旋：關燈蹲下(C)尋找破綻。"
                ]);
        } else {
             setDialogue([
                "祭壇上需要獻上四個記憶碎片以及關鍵的「畢業紀念冊」。"
             ]);
        }
    }
    else if (nearby.dialogue) {
        setDialogue(nearby.dialogue);
    }
    
    // Ending Trigger
    if (gameState === GameState.BOSS_FIGHT && nearby.id === 'jiahao_bound' && boss.health < 40) {
            setDialogue([
                "家豪... 我知道你很痛苦。",
                "我們都已經長大了，那些傷痛... 不會再傷害你了。",
                "（你緊緊握住了那雙顫抖的手）"
            ]);
            setTimeout(() => setGameState(GameState.ENDING_B), 4000);
    }
  };

  // --- RENDERING SCENES ---
  if (gameState === GameState.INTRO && player.room === RoomId.BUS_STOP && introStep === 0) {
      return (
          <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white space-y-8 z-50 overflow-hidden relative">
              <div className="scanlines w-full h-full absolute top-0 left-0" />
              <h1 className="text-7xl font-serif text-red-700 tracking-[0.5em] crt-flicker relative z-10 border-y-2 border-red-900/50 py-4">故人之夢</h1>
              <p className="text-xl text-gray-400 font-serif tracking-widest relative z-10">第一章：大禮堂</p>
               <button 
                onClick={() => setIntroStep(1)} 
                className="px-10 py-4 border border-red-800 hover:bg-red900/20 hover:border-red-500 transition-all text-red-500 mt-8 relative z-10 tracking-[0.2em] cursor-pointer"
              >
                  開始旅程 START
              </button>
          </div>
      );
  }

  if (gameState === GameState.ENDING_A) {
      return (
          <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-red-500 p-10 text-center relative overflow-hidden">
               <div className="noise-overlay" style={{opacity: 0.3}} />
              <Skull size={80} className="mb-6 animate-pulse" />
              <h2 className="text-5xl font-bold mb-6 font-serif tracking-widest">結局 A：枯萎</h2>
              <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed font-serif">
                  你用暴力摧毀了夢魘。<br/>
                  家豪消散了，但你永遠不知道他真正想說什麼。<br/>
                  (嘗試在戰鬥中更多地去「理解」他，而不是「對抗」他。)
              </p>
              <button onClick={() => window.location.reload()} className="text-white border-b border-transparent hover:border-white transition-colors">重新開始</button>
          </div>
      );
  }

  if (gameState === GameState.ENDING_B) {
      return (
          <div className="w-screen h-screen bg-[#f0f0f0] flex flex-col items-center justify-center text-black p-10 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white,transparent)] opacity-50" />
              <Heart size={80} className="mb-6 text-pink-500 drop-shadow-lg" />
              <h2 className="text-5xl font-bold mb-6 font-serif tracking-widest text-gray-800">結局 B：釋懷</h2>
              <p className="text-lg text-gray-700 mb-8 max-w-xl leading-relaxed font-serif">
                  你接納了恐懼，擁抱了過去。<br/>
                  家豪笑著離開了。<br/>
                  這場雨，終於停了。
              </p>
              <button onClick={() => window.location.reload()} className="text-black border-b border-black hover:opacity-50 transition-opacity">重新開始</button>
          </div>
      );
  }

  // Camera Logic
  const roomWidth = ROOMS[player.room].width;
  const calculatedCameraX = Math.max(0, Math.min(player.x - SCREEN_WIDTH/2, roomWidth - SCREEN_WIDTH));
  const finalCameraX = cameraOverride !== null ? cameraOverride : calculatedCameraX;
  
  const playerScreenX = (player.x - finalCameraX) + player.w / 2;
  const playerScreenY = player.y;

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#050505] select-none overflow-hidden">
        {/* Game Container: Wraps everything in relative coords matching screen size */}
        <div className="relative" style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
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
            />

            {introStep >= 3 && (
                <HUD 
                    roomName={ROOMS[player.room].name}
                    isRevealing={isRevealing}
                    isHighBeam={isHighBeam}
                    inventory={player.inventory}
                    boss={boss}
                    objective={player.battery <= 0 ? "沒電了！利用環境躲避！" : "探索校園，尋找真相"}
                    battery={player.battery}
                    stamina={player.stamina}
                    player={player} 
                />
            )}

            {dialogue && (
                <DialogueBox 
                    text={dialogue[dialogueIndex]} 
                    position={{ x: playerScreenX, y: playerScreenY }}
                />
            )}
        </div>
    </div>
  );
}

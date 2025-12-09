import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Skull, Heart } from 'lucide-react';
import { GameState, RoomId, PlayerState, BossState } from './types';
import { ROOMS, ITEMS, PLAYER_SPEED, SPRINT_SPEED, SCREEN_WIDTH, SCREEN_HEIGHT, MAX_BATTERY, MAX_STAMINA, BATTERY_DRAIN_RATE, BATTERY_RECHARGE_RATE, STAMINA_DRAIN_RATE, STAMINA_RECHARGE_RATE } from './data';
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
    flashlightOn: true, // Modified: Flashlight on by default
    battery: MAX_BATTERY,
    stamina: MAX_STAMINA
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
  const [introStep, setIntroStep] = useState(0); // 0: Start Screen, 1: Wait, 2: Boy Runs, 3: Player Control
  
  // Floating thought bubble state
  const [thought, setThought] = useState<string | null>(null);
  const thoughtTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedTriggers = useRef<Set<string>>(new Set());
  
  // Visual Effects
  const [isDistorting, setIsDistorting] = useState(false);

  // --- HOOKS ---
  const keys = useInput();
  
  // Derived Inputs
  const isRevealing = keys.current.has('q'); 
  const isSprinting = keys.current.has('shift'); 
  const isMoving = keys.current.has('w') || keys.current.has('a') || keys.current.has('s') || keys.current.has('d') ||
                   keys.current.has('arrowup') || keys.current.has('arrowleft') || keys.current.has('arrowdown') || keys.current.has('arrowright');

  // --- PROGRESSION LOGIC ---
  const isDoorLocked = useCallback((doorId: string) => {
      const invCount = player.inventory.length; 
      
      if (doorId === 'to_hall_left') return false; 
      if (doorId === 'to_hall_right') return invCount < 1;
      if (doorId === 'stairs_up_l') return invCount < 2;
      if (doorId === 'stairs_up_r') return invCount < 3;
      if (doorId === 'to_sound_sl' || doorId === 'to_sound_sr') return invCount < 4;

      return false;
  }, [player.inventory]);

  // --- HELPER: OBJECTIVE TEXT ---
  const getObjective = () => {
    if (gameState === GameState.INTRO) return "跟隨人影進入校園";
    if (gameState === GameState.BOSS_FIGHT) return "擊敗心中的夢魘！(手電筒)";
    if (gameState === GameState.ENDING_A || gameState === GameState.ENDING_B) return "遊戲結束";
    
    const invCount = player.inventory.length;
    const hasYearbook = player.inventory.includes(ITEMS.YEARBOOK);

    if (hasYearbook) return "回到大禮堂舞台，將碎片放上祭壇";
    if (invCount === 4) return "前往二樓音控室，找出最後的真相";
    if (invCount === 3) return "前往二樓右側，尋找最後的碎片";
    if (invCount === 2) return "前往二樓左側，尋找哥哥的線索";
    if (invCount === 1) return "前往一樓右側走廊探索";
    return "前往一樓左側走廊探索";
  };

  const showThought = useCallback((text: string) => {
      if (thoughtTimeoutRef.current) clearTimeout(thoughtTimeoutRef.current);
      setThought(text);
      thoughtTimeoutRef.current = setTimeout(() => setThought(null), 4000);
  }, []);

  // --- INTRO CUTSCENE LOGIC ---
  useEffect(() => {
    // Only proceed if step is 1 (User clicked Start)
    if (gameState === GameState.INTRO && introStep === 1) {
      const timer = setTimeout(() => {
         setIntroStep(2); // Start the boy running
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, introStep]);

  // CUTSCENE: Enter Lobby Logic
  useEffect(() => {
    const triggerId = 'lobby_cutscene_initial';
    if (player.room === RoomId.LOBBY && !processedTriggers.current.has(triggerId)) {
        processedTriggers.current.add(triggerId);
        
        setIsCutscene(true);
        setCameraOverride(0);

        // Sequence: Pan to stage -> Wait -> Pan Back -> Dialogue
        let panProgress = 0;
        let waiting = false;
        let panningBack = false;

        const panInterval = setInterval(() => {
            if (waiting) return;

            if (!panningBack) {
                // Pan To Stage
                panProgress += 10;
                if (panProgress >= 300) { 
                    waiting = true;
                    setCameraOverride(300);
                    // Show a thought at the stage
                    setTimeout(() => {
                         showThought("那是什麼...？");
                         setTimeout(() => {
                            waiting = false;
                            panningBack = true;
                         }, 1500);
                    }, 500);
                } else {
                    setCameraOverride(panProgress);
                }
            } else {
                // Pan Back to Player
                panProgress -= 15; // Pan back faster
                if (panProgress <= 0) {
                    clearInterval(panInterval);
                    setCameraOverride(0);
                    setTimeout(() => {
                        setDialogue([
                            "那孩子... 跑到舞台上了？",
                            "（舞台中間的紅布幕後，隱約有個人影。）",
                            "（他看起來... 被荊棘死死纏住了。）",
                            "我要過去看看。",
                            "（但其他的門似乎被黑色的藤蔓封鎖了...）",
                            "只能先從左側走廊開始調查了。"
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

    // -- Intro Cutscene Updates --
    if (gameState === GameState.INTRO && player.room === RoomId.BUS_STOP) {
         if (introStep === 2) {
             const shadowBoy = ROOMS[RoomId.BUS_STOP].entities.find(e => e.id === 'shadow_boy_intro');
             if (shadowBoy) {
                 shadowBoy.x += 6; // Run fast
                 if (shadowBoy.x > 750) {
                     shadowBoy.visibleInNormal = false;
                     shadowBoy.visibleInReveal = false;
                     // Trigger player reaction
                     setIntroStep(3);
                     setDialogue([
                         "等等！那是... 家豪？",
                         "這麼晚了，他怎麼會跑進已經廢棄的學校？",
                         "我得跟上去看看。"
                     ]);
                 }
             }
         }
         // Lock player movement during intro run
         if (introStep < 3) return;
    }

    if (isCutscene) return; 

    // -- Battery & Stamina Logic --
    setPlayer(prev => {
        let newBattery = prev.battery;
        let newStamina = prev.stamina;
        let newFlashlightOn = prev.flashlightOn;

        // Battery
        if (newFlashlightOn) {
            newBattery = Math.max(0, prev.battery - BATTERY_DRAIN_RATE);
            if (newBattery <= 0) {
                newFlashlightOn = false; // Force off
            }
        } else {
            newBattery = Math.min(MAX_BATTERY, prev.battery + BATTERY_RECHARGE_RATE);
        }

        // Stamina
        let speed = PLAYER_SPEED;
        if (isSprinting && isMoving && prev.stamina > 0) {
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

        return { 
            ...prev, 
            x: nextX, 
            y: nextY, 
            facingRight: nextFacing,
            battery: newBattery,
            stamina: newStamina,
            flashlightOn: newFlashlightOn
        };
    });

    // -- Boss Logic (Delegated) --
    if (gameState === GameState.BOSS_FIGHT && boss.active && boss.health > 0) {
        setBoss(prev => updateBossLogic(prev, player, player.flashlightOn, isRevealing, setGameState));
    }

  }, [gameState, dialogue, boss.active, boss.health, introStep, isRevealing, player.flashlightOn, keys, isMoving, isSprinting, isCutscene, player.room]);

  useGameLoop(update);

  // --- CONTROLS ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          
          if (key === 'f') {
             setPlayer(p => {
                 // Cannot turn on if empty
                 if (p.battery <= 0) return p;
                 return { ...p, flashlightOn: !p.flashlightOn };
             });
          }
          
          if (key === 'e') {
              handleInteraction();
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
      // Fixed: Added dialogueIndex to dependencies to prevent stale closures
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
        return distA - distB;
    });

    const nearby = candidates[0];

    if (nearby.type === 'door' && nearby.targetRoom) {
        if (isDoorLocked(nearby.id)) {
            setDialogue([
                "這扇門被黑色的藤蔓死死封住了。",
                "必須先找到解開這個心結的關鍵碎片。"
            ]);
            showThought("打不開...");
            return;
        }

        let targetX = nearby.targetX || 100;
        setPlayer(p => ({...p, room: nearby.targetRoom!, x: targetX}));
        
        if (gameState === GameState.INTRO && nearby.targetRoom === RoomId.LOBBY) {
            setGameState(GameState.EXPLORATION);
        }
    } 
    else if (nearby.type === 'item') {
        if (!player.inventory.includes(nearby.id)) {
            setPlayer(p => ({...p, inventory: [...p.inventory, nearby.id]}));
            if (nearby.dialogue) setDialogue(nearby.dialogue);
        }
    }
    else if (nearby.id === 'boss_altar') {
        const required = [ITEMS.SHARD_TROPHY, ITEMS.SHARD_TOY, ITEMS.BELT_BUCKLE, ITEMS.DIARY_PAGE];
        const collected = required.filter(i => player.inventory.includes(i));
        
        if (collected.length >= 4 && player.inventory.includes(ITEMS.YEARBOOK)) {
                setGameState(GameState.BOSS_FIGHT);
                setBoss(b => ({...b, active: true, x: 600, y: 350}));
                setDialogue([
                    "你將畢業紀念冊與碎片放上舞台...",
                    "九重葛開始瘋狂蠕動！",
                    "家豪發出痛苦的尖叫：「不要看我！不要看裡面！」",
                    "【戰鬥開始】按住 Q 看取核心，並用 F 開啟手電筒照射來造成傷害！"
                ]);
        } else {
             setDialogue([
                "祭壇上需要獻上四個記憶碎片以及關鍵的「畢業紀念冊」。",
                "當一切準備就緒，才能喚醒真正的他。"
             ]);
        }
    }
    else if (nearby.dialogue) {
        setDialogue(nearby.dialogue);
    }
    
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
                  家豪的花倀型態被你摧毀了。<br/>
                  他最後的眼神充滿了恐懼，就像當年看著父親皮帶落下時一樣。<br/>
                  你活下來了，但並沒有拯救任何人。
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
                  藤蔓枯萎，化作無數花瓣飄散。<br/>
                  家豪最後露出了久違的笑容：「謝謝你還記得我。」<br/>
                  這場夢魘或許還未結束，但至少這個靈魂已得到安息。
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
                isFlashlightOn={player.flashlightOn}
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
                    isFlashlightOn={player.flashlightOn}
                    inventory={player.inventory}
                    boss={boss}
                    objective={getObjective()}
                    battery={player.battery}
                    stamina={player.stamina}
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
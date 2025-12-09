import React, { useState, useCallback, useRef } from 'react';
import { Skull, Heart } from 'lucide-react';
import { GameState, RoomId, PlayerState, BossState } from './types';
import { ROOMS, ITEMS, PLAYER_SPEED, BOSS_SPEED } from './data';
import { useInput, useGameLoop } from './hooks';
import { WorldRenderer, HUD, DialogueBox, ThoughtBubble } from './components';

export default function App() {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [player, setPlayer] = useState<PlayerState>({
    room: RoomId.BUS_STOP,
    x: 100, y: 450, w: 40, h: 80,
    facingRight: true,
    inventory: [],
    health: 100,
    sanity: 100
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
  const [tutorialStep, setTutorialStep] = useState(0); 
  
  // Floating thought bubble state
  const [thought, setThought] = useState<string | null>(null);
  const thoughtTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processedTriggers = useRef<Set<string>>(new Set());
  
  // Visual Effects
  const [isDistorting, setIsDistorting] = useState(false);

  // --- HOOKS ---
  const keys = useInput();
  
  // Derived Inputs
  const isRevealing = keys.current.has(' ') || keys.current.has('space');
  const isFlashlightOn = keys.current.has('shift');
  const isMoving = keys.current.has('w') || keys.current.has('a') || keys.current.has('s') || keys.current.has('d') ||
                   keys.current.has('arrowup') || keys.current.has('arrowleft') || keys.current.has('arrowdown') || keys.current.has('arrowright');

  // --- LOGIC ---
  
  const showThought = useCallback((text: string) => {
      if (thoughtTimeoutRef.current) clearTimeout(thoughtTimeoutRef.current);
      setThought(text);
      thoughtTimeoutRef.current = setTimeout(() => setThought(null), 4000);
  }, []);

  const updateBoss = useCallback((prevBoss: BossState, currentPlayer: PlayerState) => {
    let nextBoss = { ...prevBoss };

    if (nextBoss.stunned) {
        if (nextBoss.stunTimer > 0) {
            nextBoss.stunTimer -= 1;
        } else {
            nextBoss.stunned = false;
        }
        return nextBoss;
    }

    let nextX = nextBoss.x;
    let nextY = nextBoss.y;
    
    const dx = currentPlayer.x - nextBoss.x;
    const dy = currentPlayer.y - nextBoss.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Chase
    if (dist > 50) {
        nextX += (dx / dist) * BOSS_SPEED;
        nextY += (dy / dist) * BOSS_SPEED;
    }

    // Flashlight Impact
    if (isFlashlightOn) {
        const playerFacingBoss = (currentPlayer.x < nextBoss.x && currentPlayer.facingRight) || (currentPlayer.x > nextBoss.x && !currentPlayer.facingRight);
        const inRange = dist < 300;
        if (playerFacingBoss && inRange) {
             nextX -= (dx / dist) * BOSS_SPEED * 1.5; // Pushback
        }
    }

    // Reveal Damage Mechanic
    let newHealth = nextBoss.health;
    let newStunned = nextBoss.stunned;
    
    // Player needs to look at boss in reveal mode to damage core
    if (isRevealing) {
         const playerFacingBoss = (currentPlayer.x < nextBoss.x && currentPlayer.facingRight) || (currentPlayer.x > nextBoss.x && !currentPlayer.facingRight);
         if (playerFacingBoss && dist < 400) {
             newHealth -= 0.3; // DPS
         }
    }

    // Flashlight Stuns if very close
    if (isFlashlightOn && dist < 100 && !nextBoss.stunned && Math.random() < 0.02) {
        newStunned = true;
        nextBoss.stunTimer = 120;
    }

    if (newHealth <= 0) {
        setGameState(GameState.ENDING_A);
    }

    nextBoss.x = nextX;
    nextBoss.y = nextY;
    nextBoss.health = newHealth;
    nextBoss.stunned = newStunned;

    return nextBoss;
  }, [isRevealing, isFlashlightOn]);

  const update = useCallback((time: number) => {
    if (dialogue) return; // Pause updates during dialogue

    // -- Tutorial Progress --
    const hasMoved = isMoving;
    if (gameState === GameState.INTRO && tutorialStep === 0 && hasMoved) setTutorialStep(1);
    if (tutorialStep === 1 && isRevealing) setTutorialStep(2);
    if (tutorialStep === 2 && isFlashlightOn) setTutorialStep(3);

    // -- Player Movement (Normalized Vector) --
    setPlayer(prev => {
      let dx = 0;
      let dy = 0;

      if (keys.current.has('w') || keys.current.has('arrowup')) dy -= 1;
      if (keys.current.has('s') || keys.current.has('arrowdown')) dy += 1;
      if (keys.current.has('a') || keys.current.has('arrowleft')) dx -= 1;
      if (keys.current.has('d') || keys.current.has('arrowright')) dx += 1;

      // Normalize diagonal movement and adjust Aspect Ratio for 2.5D feel
      // Y movement is deliberately slower to simulate depth walking
      if (dx !== 0 || dy !== 0) {
          const length = Math.sqrt(dx*dx + dy*dy);
          dx = (dx / length) * PLAYER_SPEED;
          dy = (dy / length) * PLAYER_SPEED * 0.6; // Y is 60% speed of X
      }

      let nextX = prev.x + dx;
      let nextY = prev.y + dy;
      let nextFacing = prev.facingRight;
      
      if (dx < 0) nextFacing = false;
      if (dx > 0) nextFacing = true;

      const room = ROOMS[prev.room];
      
      // Bounds
      if (nextX < 0) nextX = 0;
      if (nextX > room.width - prev.w) nextX = room.width - prev.w;
      
      const floorTop = 380; // Adjusted for new visuals
      const floorBottom = 540; // Adjusted for floor bar
      if (nextY < floorTop) nextY = floorTop;
      if (nextY > floorBottom - prev.h) nextY = floorBottom - prev.h;

      return { ...prev, x: nextX, y: nextY, facingRight: nextFacing };
    });

    // -- Monologue Triggers --
    const triggerId = (id: string) => `${player.room}_${id}`;
    
    // Trigger: Enter Lobby for first time
    if (player.room === RoomId.LOBBY && player.x > 200 && !processedTriggers.current.has(triggerId('lobby_intro'))) {
        showThought("這就是大禮堂... 比記憶中更加破舊了。");
        processedTriggers.current.add(triggerId('lobby_intro'));
    }
    // Trigger: Approach Stage (Coordinates updated for new layout)
    if (player.room === RoomId.LOBBY && player.x > 500 && player.x < 800 && !processedTriggers.current.has(triggerId('stage_approach'))) {
        showThought("舞台... 那些紅色的布幕，看起來像凝固的血。");
        processedTriggers.current.add(triggerId('stage_approach'));
    }
    // Trigger: Sound Room
    if (player.room === RoomId.SOUND_ROOM && !processedTriggers.current.has(triggerId('sound_enter'))) {
        showThought("這裡可以俯瞰整個舞台。就像... 審判席一樣。");
        processedTriggers.current.add(triggerId('sound_enter'));
    }

    // -- Boss Logic --
    if (gameState === GameState.BOSS_FIGHT && boss.active && boss.health > 0) {
        setBoss(prev => updateBoss(prev, player));
    }

  }, [gameState, dialogue, boss.active, boss.health, tutorialStep, isRevealing, isFlashlightOn, player, updateBoss, keys, showThought, isMoving]);

  useGameLoop(update);

  // --- INTERACTION HANDLER ---
  const handleInteraction = () => {
    if (dialogue) {
        if (dialogueIndex < dialogue.length - 1) {
            setDialogueIndex(i => i + 1);
        } else {
            // Dialogue ended
            setDialogue(null);
            setDialogueIndex(0);
            
            // SPECIAL TRIGGER: YEARBOOK PICKUP
            if (player.inventory.includes(ITEMS.YEARBOOK) && (gameState === GameState.INTRO || gameState === GameState.EXPLORATION)) {
                // Start Distortion Effect
                setIsDistorting(true);
                showThought("不... 頭好痛...");
                
                setTimeout(() => {
                    setGameState(GameState.CORRUPTED);
                    setIsDistorting(false); // End distortion after transition
                }, 1500);
            }
        }
        return;
    }

    const room = ROOMS[player.room];
    
    // Find all valid interaction candidates
    const candidates = room.entities.filter(e => {
        // Filter out items already in inventory
        if (e.type === 'item' && player.inventory.includes(e.id)) return false;

        // Filter based on current visibility mode
        const isVisible = (e.visibleInNormal && !isRevealing) || 
                          (e.visibleInReveal && isRevealing) || 
                          (e.visibleInNormal && e.visibleInReveal);
        if (!isVisible) return false;

        const dx = (player.x + player.w/2) - (e.x + e.w/2);
        const dy = (player.y + player.h/2) - (e.y + e.h/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        return dist < 100;
    });

    if (candidates.length === 0) return;

    // Prioritize the closest one
    candidates.sort((a, b) => {
        const distA = Math.hypot((player.x + player.w/2) - (a.x + a.w/2), (player.y + player.h/2) - (a.y + a.h/2));
        const distB = Math.hypot((player.x + player.w/2) - (b.x + b.w/2), (player.y + player.h/2) - (b.y + b.h/2));
        return distA - distB;
    });

    const nearby = candidates[0];

    // Execute Interaction
    if (nearby.type === 'door' && nearby.targetRoom) {
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
        
        if (collected.length >= 3) {
                setGameState(GameState.BOSS_FIGHT);
                setBoss(b => ({...b, active: true, x: 600, y: 350})); // Spawn boss at new stage center
                setDialogue([
                    "你將記憶碎片放上舞台...",
                    "九重葛開始瘋狂蠕動！",
                    "家豪發出痛苦的尖叫：「不要看我！不要看裡面！」",
                    "【戰鬥開始】按住 SPACE 看取核心，並用 SHIFT 手電筒照射來造成傷害！"
                ]);
        } else {
                setDialogue([
                    "還缺了一些東西...",
                    `你需要找到家豪的記憶碎片。目前找到 (${collected.length}/4)。`,
                    "去一樓和二樓的四個角落，用「看取」尋找真相。"
                ]);
        }
    }
    else if (nearby.dialogue) {
        setDialogue(nearby.dialogue);
    }
    
    // Secret Boss Interaction
    if (gameState === GameState.BOSS_FIGHT && nearby.id === 'jiahao_bound' && boss.health < 40) {
            setDialogue([
                "家豪... 我知道你很痛苦。",
                "我們都已經長大了，那些傷痛... 不會再傷害你了。",
                "（你緊緊握住了那雙顫抖的手）"
            ]);
            setTimeout(() => setGameState(GameState.ENDING_B), 4000);
    }
  };

  // Keyboard Event for 'E' (Interaction)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'e') handleInteraction();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, gameState, dialogue, dialogueIndex, boss]);


  // --- RENDERING ---

  // Intro Screen
  if (gameState === GameState.INTRO && player.room === RoomId.BUS_STOP && player.x < 200) {
      return (
          <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white space-y-8 z-50 overflow-hidden relative">
              <div className="scanlines w-full h-full absolute top-0 left-0" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,0,0,0.5),rgba(0,0,0,1))]" />
              
              <h1 className="text-7xl font-serif text-red-700 tracking-[0.5em] crt-flicker relative z-10 border-y-2 border-red-900/50 py-4">故人之夢</h1>
              <p className="text-xl text-gray-400 font-serif tracking-widest relative z-10">第一章：大禮堂</p>
              
              <div className="flex flex-col items-center space-y-3 text-sm text-gray-500 relative z-10 bg-black/50 p-6 rounded border border-gray-800 backdrop-blur-sm">
                  <div className="flex items-center gap-3"><span className="border border-gray-600 px-2 py-1 rounded text-gray-300">W A S D</span> <span className="text-xs">移動 Movement</span></div>
                  <div className="flex items-center gap-3"><span className="border border-gray-600 px-2 py-1 rounded text-gray-300 w-20 text-center">SPACE</span> <span className="text-xs">看取 Reveal</span></div>
                  <div className="flex items-center gap-3"><span className="border border-gray-600 px-2 py-1 rounded text-gray-300 w-20 text-center">SHIFT</span> <span className="text-xs">手電筒 Flashlight</span></div>
                  <div className="flex items-center gap-3"><span className="border border-gray-600 px-2 py-1 rounded text-gray-300 w-20 text-center">E</span> <span className="text-xs">互動 Interact</span></div>
              </div>

              <button 
                onClick={() => setPlayer(p => ({...p, x: 250}))}
                className="px-10 py-4 border border-red-800 hover:bg-red-900/20 hover:border-red-500 transition-all text-red-500 mt-8 relative z-10 tracking-[0.2em]"
              >
                  開始旅程 START
              </button>
          </div>
      );
  }

  // Endings
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

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-[#050505] select-none relative overflow-hidden">
        <WorldRenderer 
            room={ROOMS[player.room]}
            player={player}
            boss={boss}
            isRevealing={isRevealing}
            isFlashlightOn={isFlashlightOn}
            isCorrupted={gameState === GameState.CORRUPTED || gameState === GameState.BOSS_FIGHT}
            isDistorting={isDistorting}
            thought={thought}
            isMoving={isMoving}
        />

        <HUD 
            roomName={ROOMS[player.room].name}
            isRevealing={isRevealing}
            isFlashlightOn={isFlashlightOn}
            inventory={player.inventory}
            boss={boss}
        />

        {dialogue && <DialogueBox text={dialogue[dialogueIndex]} />}

        {gameState === GameState.INTRO && !dialogue && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-center text-white/40 text-xs animate-pulse z-50 font-mono">
                {tutorialStep === 0 && "[ USE W A S D TO MOVE ]"}
                {tutorialStep === 1 && "[ HOLD SPACE TO REVEAL SECRETS ]"}
                {tutorialStep === 2 && "[ HOLD SHIFT FOR LIGHT ]"}
            </div>
        )}
    </div>
  );
}

import { BossState, PlayerState, GameState } from './types';
import { BOSS_SPEED_NORMAL, BOSS_SPEED_AGGRO } from './data';

export const updateBossLogic = (
  prevBoss: BossState, 
  player: PlayerState, 
  isFlashlightOn: boolean,
  isHighBeam: boolean, 
  setGameState: (state: GameState) => void,
  setPlayer: (fn: (p: PlayerState) => PlayerState) => void
): BossState => {
    let nextBoss = { ...prevBoss };

    // Stun recovery
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
    
    const dx = player.x - nextBoss.x;
    const dy = player.y - nextBoss.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // --- AI BEHAVIOR: PHOTOTAXIS (向光性) ---
    // If Flashlight is ON, boss is aggressive and moves fast towards player
    // If Flashlight is OFF, boss is slow and wanders
    
    if (isFlashlightOn) {
        // Aggressive Chase
        nextX += (dx / dist) * BOSS_SPEED_AGGRO;
        nextY += (dy / dist) * BOSS_SPEED_AGGRO;
    } else {
        // Slow Wander / Search
        // Move slightly towards player but mostly noise
        if (dist > 100) {
            nextX += (dx / dist) * BOSS_SPEED_NORMAL * 0.5 + (Math.random() - 0.5) * 2;
            nextY += (dy / dist) * BOSS_SPEED_NORMAL * 0.5 + (Math.random() - 0.5) * 2;
        }
    }

    // --- DAMAGE LOGIC ---

    // 1. Player Damage (Touch)
    if (dist < 60) {
        setPlayer(p => ({ ...p, health: p.health - 1 }));
    }

    // 2. Boss Damage (High Beam ONLY)
    if (isHighBeam && isFlashlightOn && player.battery > 0) {
        // Must be facing boss
        const playerFacingBoss = (player.x < nextBoss.x && player.facingRight) || (player.x > nextBoss.x && !player.facingRight);
        
        if (playerFacingBoss && dist < 400) {
             // Damage Boss
             nextBoss.health -= 0.5; // High DPS
             
             // Slow pushback
             nextX -= (dx / dist) * 1.0; 
             nextY -= (dy / dist) * 1.0;
             
             // Visual stun effect occasionally
             if (Math.random() < 0.1) {
                 nextBoss.stunned = true;
                 nextBoss.stunTimer = 10;
             }
        }
    }
    
    if (nextBoss.health <= 0) {
        setGameState(GameState.ENDING_WITHER);
    }

    nextBoss.x = nextX;
    nextBoss.y = nextY;

    return nextBoss;
};

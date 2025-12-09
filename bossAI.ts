
import { BossState, PlayerState, GameState } from './types';
import { BOSS_SPEED } from './data';

export const updateBossLogic = (
  prevBoss: BossState, 
  player: PlayerState, 
  isHighBeam: boolean, 
  isRevealing: boolean,
  triggerEnding: (ending: GameState) => void
): BossState => {
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
    
    const dx = player.x - nextBoss.x;
    const dy = player.y - nextBoss.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // --- DETECTION LOGIC (STEALTH) ---
    // Base detection radius
    let detectionRadius = 400; 
    
    // Stealth modifiers
    if (player.isCrouching) {
        detectionRadius = 150 - (player.stealth * 20); // Stealth stats reduce range further
    }
    
    // Flashlight increases detection
    if (player.flashlightOn) {
        detectionRadius = 600;
    }

    // Chase Logic
    if (dist < detectionRadius) {
        nextX += (dx / dist) * BOSS_SPEED;
        nextY += (dy / dist) * BOSS_SPEED;
    } else {
        // Idle / Patrol (Jitter)
        nextX += (Math.random() - 0.5) * 2;
        nextY += (Math.random() - 0.5) * 2;
    }

    // --- DAMAGE LOGIC ---

    // 1. Flashlight Pushback (High Beam only)
    if (isHighBeam) {
        const playerFacingBoss = (player.x < nextBoss.x && player.facingRight) || (player.x > nextBoss.x && !player.facingRight);
        const inRange = dist < 300;
        if (playerFacingBoss && inRange) {
             nextX -= (dx / dist) * BOSS_SPEED * 1.5; 
             // Chance to stun
             if (dist < 100 && !nextBoss.stunned && Math.random() < 0.02) {
                nextBoss.stunned = true;
                nextBoss.stunTimer = 120;
            }
        }
    }

    // 2. Reveal Damage (Looking at core)
    let newHealth = nextBoss.health;
    let newStunned = nextBoss.stunned;
    
    if (isRevealing) {
         const playerFacingBoss = (player.x < nextBoss.x && player.facingRight) || (player.x > nextBoss.x && !player.facingRight);
         if (playerFacingBoss && dist < 400) {
             newHealth -= 0.3; // Psychic DPS
         }
    }
    
    // 3. Physical Damage (Handled in App.tsx handleAttack, but checking death here)

    if (newHealth <= 0) {
        triggerEnding(GameState.ENDING_A);
    }

    nextBoss.x = nextX;
    nextBoss.y = nextY;
    nextBoss.health = newHealth;
    nextBoss.stunned = newStunned;

    return nextBoss;
};

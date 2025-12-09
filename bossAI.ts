
import { BossState, PlayerState, GameState } from './types';
import { BOSS_SPEED } from './data';

export const updateBossLogic = (
  prevBoss: BossState, 
  player: PlayerState, 
  isFlashlightOn: boolean, 
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

    // Chase Logic
    if (dist > 50) {
        nextX += (dx / dist) * BOSS_SPEED;
        nextY += (dy / dist) * BOSS_SPEED;
    }

    // Flashlight Impact (Pushback)
    if (isFlashlightOn) {
        const playerFacingBoss = (player.x < nextBoss.x && player.facingRight) || (player.x > nextBoss.x && !player.facingRight);
        const inRange = dist < 300;
        if (playerFacingBoss && inRange) {
             nextX -= (dx / dist) * BOSS_SPEED * 1.5; 
        }
    }

    // Reveal Damage Mechanic
    let newHealth = nextBoss.health;
    let newStunned = nextBoss.stunned;
    
    // Player needs to look at boss in reveal mode to damage core
    if (isRevealing) {
         const playerFacingBoss = (player.x < nextBoss.x && player.facingRight) || (player.x > nextBoss.x && !player.facingRight);
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
        triggerEnding(GameState.ENDING_A);
    }

    nextBoss.x = nextX;
    nextBoss.y = nextY;
    nextBoss.health = newHealth;
    nextBoss.stunned = newStunned;

    return nextBoss;
};

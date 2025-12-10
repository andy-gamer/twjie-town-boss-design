

import { BossState, PlayerState, GameState, VineAttack } from './types';
import { BOSS_SPEED_IDLE, BOSS_SPEED_AGGRO, BOSS_SPEED_SCARED, BOSS_HEAR_RANGE, VINE_ATTACK_RANGE } from './data';

const STAGE_THRESHOLD_Y = 350; 
const STAIRS_LEFT_X = 450;
const STAIRS_RIGHT_X = 1100;
const STAIR_SNAP_DIST = 10; 
const STAGE_Y_LEVEL = 220; 
const FLOOR_Y_LEVEL = 400;

// Stage Constraints to keep boss in view
const STAGE_MIN_X = 500;
const STAGE_MAX_X = 1100;

const MUTTER_LINES = [
    "好痛...", "哥哥...", "為什麼...", "好黑...", "走開...", 
    "身體...好癢...", "嗚嗚...", "不要看我...", "對不起...", 
    "讓我...睡覺..."
];

const PAIN_LINES = [
    "啊啊啊！", "好燙！", "住手！", "燒起來了..."
];

export const updateBossLogic = (
  prevBoss: BossState, 
  player: PlayerState, 
  isFlashlightOn: boolean,
  isHighBeam: boolean, 
  setGameState: (update: GameState | ((prevState: GameState) => GameState)) => void,
  setPlayer: (fn: (p: PlayerState) => PlayerState) => void,
  onHit: () => void,
  onDetect?: () => void
): BossState => {
    let nextBoss = { ...prevBoss };
    
    // Safety check
    if (!nextBoss.vineAttack) nextBoss.vineAttack = { active: false, targetX: 0, targetY: 0, progress: 0 };
    if (!nextBoss.aiState) nextBoss.aiState = 'WANDER';
    if (nextBoss.stateTimer > 0) nextBoss.stateTimer--;

    // 0. Muttering Logic (Emotional Ambience)
    if (nextBoss.mutterTimer > 0) {
        nextBoss.mutterTimer--;
    } else {
        if (nextBoss.mutterText) {
             nextBoss.mutterText = null;
             nextBoss.mutterTimer = Math.random() * 200 + 100; 
        } else {
             nextBoss.mutterText = MUTTER_LINES[Math.floor(Math.random() * MUTTER_LINES.length)];
             nextBoss.mutterTimer = 180; 
        }
    }

    // 1. Stun Recovery
    if (nextBoss.stunned) {
        if (nextBoss.stunTimer > 0) {
            nextBoss.stunTimer -= 1;
        } else {
            nextBoss.stunned = false;
        }
        return nextBoss;
    }

    // 2. DETECTION LOGIC
    const rawDx = player.x - nextBoss.x;
    const rawDy = player.y - nextBoss.y;
    const distToPlayer = Math.sqrt(rawDx*rawDx + rawDy*rawDy);
    
    let isDetected = false;
    
    // Stealth Logic
    const isMoving = Math.abs(player.vx) > 0.1;
    let detectionModifier = 1.0;
    
    // Sound generation
    if (isMoving) {
        if (player.isCrouching) {
            detectionModifier = 0.1; // Silent
        } else {
            detectionModifier = 1.5; // Walking/Running triggers detection
        }
    } else {
        detectionModifier = 0.05; // Silent standing
    }

    // Light Logic for Detection
    if (isFlashlightOn) {
         // Light makes it see you clearly regardless of stealth
         isDetected = true;
    } else {
        // Darkness: It hunts by sound
        const effectiveHearRange = BOSS_HEAR_RANGE * detectionModifier;
        if (distToPlayer < effectiveHearRange) {
            isDetected = true;
        }
    }

    const prevAIState = nextBoss.aiState;

    if (nextBoss.aiState !== 'ATTACK' && nextBoss.aiState !== 'WINDUP' && nextBoss.aiState !== 'COOLDOWN') {
        if (isDetected) {
            nextBoss.aiState = 'CHASE';
        } else {
            nextBoss.aiState = 'WANDER';
        }
    }

    // Trigger detection sound
    if (prevAIState !== 'CHASE' && nextBoss.aiState === 'CHASE' && onDetect) {
        onDetect();
    }

    // 3. MOVEMENT LOGIC & LOW HP FRENZY
    let targetX = nextBoss.x;
    let targetY = nextBoss.y; 
    
    let speed = BOSS_SPEED_AGGRO; // Default dark speed
    
    // Determine target based on state
    if (nextBoss.aiState === 'CHASE') {
        targetX = player.x;
        const playerOnStage = player.y < STAGE_THRESHOLD_Y;
        targetY = playerOnStage ? STAGE_Y_LEVEL : FLOOR_Y_LEVEL;
    } else if (nextBoss.aiState === 'WANDER') {
        if (nextBoss.stateTimer <= 0) {
            nextBoss.stateTimer = Math.random() * 120 + 60; 
        }
        // Wander within limits
        targetX = nextBoss.x + Math.sin(Date.now() / 3000) * 80;
        targetY = nextBoss.y < STAGE_THRESHOLD_Y ? STAGE_Y_LEVEL : FLOOR_Y_LEVEL;
    }

    // Speed Logic
    if (isFlashlightOn) {
        if (isHighBeam) {
            speed = BOSS_SPEED_SCARED; 
            // Scared logic: Chance to cancel attacks
            if (nextBoss.aiState === 'WINDUP' && Math.random() < 0.2) {
                nextBoss.aiState = 'CHASE'; // Cancel attack
                nextBoss.stateTimer = 20;
            }
        } else {
            speed = BOSS_SPEED_IDLE; // Slow down in light
        }
    } else {
        // Darkness
        if (nextBoss.health < 30) {
             speed = BOSS_SPEED_AGGRO * 1.5; // Frenzy: 50% faster in dark when low HP
        } else {
             speed = BOSS_SPEED_AGGRO;
        }
    }

    // Pathfinding with Stairs
    if (nextBoss.aiState === 'CHASE' || nextBoss.aiState === 'WANDER') {
        const bossOnStage = nextBoss.y < STAGE_THRESHOLD_Y;
        const targetOnStage = targetY < STAGE_THRESHOLD_Y;

        let finalDestX = targetX;
        let finalDestY = targetY; 

        // If boss and target are on different levels, force pathing through stairs
        if (bossOnStage !== targetOnStage) {
            const distLeft = Math.abs(nextBoss.x - STAIRS_LEFT_X);
            const distRight = Math.abs(nextBoss.x - STAIRS_RIGHT_X);
            const closestStairX = distLeft < distRight ? STAIRS_LEFT_X : STAIRS_RIGHT_X;
            
            finalDestX = closestStairX;
            // Only change Y level if near the stairs
            if (Math.abs(nextBoss.x - closestStairX) < STAIR_SNAP_DIST) {
                finalDestY = targetOnStage ? STAGE_Y_LEVEL : FLOOR_Y_LEVEL; 
            } else {
                // Stay on current level until at stairs
                finalDestY = bossOnStage ? STAGE_Y_LEVEL : FLOOR_Y_LEVEL;
            }
        } else {
             finalDestY = bossOnStage ? STAGE_Y_LEVEL : FLOOR_Y_LEVEL;
        }

        const dx = finalDestX - nextBoss.x;
        const dy = finalDestY - nextBoss.y;
        const distToDest = Math.sqrt(dx*dx + dy*dy);
        
        if (distToDest > 2) {
            nextBoss.x += (dx / distToDest) * speed;
            nextBoss.y += (dy / distToDest) * speed;
        }
    }
    
    // HARD STAGE CONSTRAINTS (After movement)
    // Clamp X
    nextBoss.x = Math.max(STAGE_MIN_X, Math.min(STAGE_MAX_X, nextBoss.x));
    
    // Snap Y if not transitioning stairs (prevents floating)
    const distLeftStairs = Math.abs(nextBoss.x - STAIRS_LEFT_X);
    const distRightStairs = Math.abs(nextBoss.x - STAIRS_RIGHT_X);
    const nearStairs = distLeftStairs < 20 || distRightStairs < 20;
    
    if (!nearStairs) {
        if (Math.abs(nextBoss.y - STAGE_Y_LEVEL) < 20) nextBoss.y = STAGE_Y_LEVEL;
        else if (Math.abs(nextBoss.y - FLOOR_Y_LEVEL) < 20) nextBoss.y = FLOOR_Y_LEVEL;
    }

    // 4. ATTACK LOGIC
    // Trigger condition: Close Range AND (Light On OR Noisy)
    const isNoisy = !player.isCrouching && isMoving;
    const canAttack = distToPlayer < VINE_ATTACK_RANGE && (isFlashlightOn || isNoisy);

    if (nextBoss.aiState === 'CHASE' && canAttack && nextBoss.stateTimer <= 0) {
        // Only attack if on roughly same Y level
        if (Math.abs(nextBoss.y - player.y) < 100) { 
            nextBoss.aiState = 'WINDUP';
            // Windup: Faster if low HP in dark
            let windupTime = isFlashlightOn ? 90 : 60;
            if (nextBoss.health < 30 && !isFlashlightOn) windupTime = 30; // Significantly shorter windup (Frenzy)
            nextBoss.stateTimer = windupTime;
            nextBoss.vineAttack.active = true;
            nextBoss.vineAttack.progress = 0;
            // Set initial target
            nextBoss.vineAttack.targetX = player.x + player.w/2;
            nextBoss.vineAttack.targetY = player.y + player.h/2;
        }
    }

    if (nextBoss.aiState === 'WINDUP') {
        // Track player during Windup with lerp (adds difficulty but still allows dodging at last second)
        if (nextBoss.stateTimer > 10) { // Stop tracking 10 frames before attack locks in
            const pCenterX = player.x + player.w/2;
            const pCenterY = player.y + player.h/2;
            nextBoss.vineAttack.targetX += (pCenterX - nextBoss.vineAttack.targetX) * 0.15;
            nextBoss.vineAttack.targetY += (pCenterY - nextBoss.vineAttack.targetY) * 0.15;
        }

        if (nextBoss.stateTimer <= 0) {
            nextBoss.aiState = 'ATTACK';
            nextBoss.stateTimer = 30; 
        }
    } else if (nextBoss.aiState === 'ATTACK') {
        nextBoss.vineAttack.progress += 0.08;
        if (nextBoss.vineAttack.progress >= 1) {
            // Check Hit
            const pCenterX = player.x + player.w/2;
            const pCenterY = player.y + player.h/2;
            const dx = pCenterX - nextBoss.vineAttack.targetX;
            const dy = pCenterY - nextBoss.vineAttack.targetY;
            const distToImpact = Math.sqrt(dx*dx + dy*dy);

            if (distToImpact < 60) { // Hitbox size
                setPlayer(p => ({ ...p, health: p.health - 25 }));
                setGameState(state => state);
            }
            
            nextBoss.aiState = 'COOLDOWN';
            let cooldown = isFlashlightOn ? 140 : 100;
            if (nextBoss.health < 30 && !isFlashlightOn) cooldown = 60; 
            nextBoss.stateTimer = cooldown;
            nextBoss.vineAttack.active = false;
        }
    } else if (nextBoss.aiState === 'COOLDOWN') {
        if (nextBoss.stateTimer <= 0) {
             nextBoss.aiState = 'CHASE';
        }
    }

    // 5. DAMAGE LOGIC (Player hitting Boss)
    // Use Angular Cone Check instead of simple Y height check
    if (isHighBeam && isFlashlightOn && player.battery > 0) {
         // Calculate angle from player to boss
         const pSrcX = player.x + player.w/2;
         const pSrcY = player.y + 10; 
         
         const bTgtX = nextBoss.x + 30; // Boss Center X
         const bTgtY = nextBoss.y - 40; // Boss Center Y
         
         const dx = bTgtX - pSrcX;
         const dy = bTgtY - pSrcY;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         // Angle check is loose because we have Auto-Aim now in App.tsx
         // But we keep basic bounds check
         const isFacingCorrectly = (player.facingRight && dx > 0) || (!player.facingRight && dx < 0);
         
         if (dist < 600 && isFacingCorrectly) {
              nextBoss.health -= 0.05; // Reduced damage to force 5-10 bursts 
              nextBoss.lastHit = Date.now();
              onHit();
              
              // INTERRUPT LOGIC: Taking damage immediately breaks focus/windup
              if (nextBoss.aiState === 'WINDUP' || nextBoss.aiState === 'ATTACK') {
                   nextBoss.aiState = 'WANDER'; // Break current action
                   nextBoss.stateTimer = 30; // Brief hesitation/flinch
                   nextBoss.vineAttack.active = false;
                   
                   if (Math.random() < 0.3) {
                       nextBoss.mutterText = PAIN_LINES[Math.floor(Math.random() * PAIN_LINES.length)];
                       nextBoss.mutterTimer = 60;
                   }
              }
              
              if (Math.random() < 0.005) {
                  nextBoss.stunned = true;
                  nextBoss.stunTimer = 60;
              }
         }
    }

    // Contact Damage (Touching boss)
    if (distToPlayer < 40) {
        setPlayer(p => ({ ...p, health: p.health - 0.5 }));
    }

    if (nextBoss.health < 0) nextBoss.health = 0;

    return nextBoss;
};
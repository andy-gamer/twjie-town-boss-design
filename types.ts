
export enum GameState {
  INTRO = 'INTRO',         
  EXPLORATION = 'EXPLORATION', 
  CORRUPTED = 'CORRUPTED', 
  BOSS_FIGHT = 'BOSS_FIGHT',
  ENDING_WITHER = 'ENDING_WITHER',   // Good: Withered away
  ENDING_COCOON = 'ENDING_COCOON',   // Bad: Turned into cocoon
}

export enum RoomId {
  BUS_STOP = 'BUS_STOP',
  LOBBY = 'LOBBY',
  HALL_LEFT = 'HALL_LEFT',    
  HALL_RIGHT = 'HALL_RIGHT',  
  SEATS_LEFT = 'SEATS_LEFT',  
  SEATS_RIGHT = 'SEATS_RIGHT',
  SOUND_ROOM = 'SOUND_ROOM',  
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type EntityType = 'npc' | 'item' | 'door' | 'decoration' | 'boss_core' | 'trap' | 'save_point' | 'stairs';

export interface Entity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  w: number;
  h: number;
  
  // Visuals
  color?: string;
  label?: string; 
  icon?: string; 
  
  // Logic
  interactable: boolean;
  reqItem?: string;
  
  // Visibility Mechanics
  visibleInNormal: boolean;
  visibleInReveal: boolean; 
  
  // Narrative
  dialogue?: string[];
  revealText?: string; 
  
  // Door/Stairs Logic
  targetRoom?: RoomId;
  targetX?: number;
  targetY?: number; // For stairs within same room
}

export interface RoomData {
  id: RoomId;
  name: string;
  width: number;
  height: number;
  backgroundClass: string;
  entities: Entity[];
}

export interface PlayerState {
  room: RoomId;
  x: number;
  y: number;
  z: number; // Height (Jump)
  vx: number; 
  vy: number; 
  vz: number; // Vertical Velocity
  w: number;
  h: number;
  facingRight: boolean;
  aimAngle: number; // -45 to 45 degrees for flashlight
  inventory: string[];
  health: number;
  sanity: number;
  
  // Mechanics
  flashlightOn: boolean; // Main toggle (F)
  isCrouching: boolean; // Stealth Mode (Shift)
  battery: number;
  stamina: number;
}

/**
 * Boss AI State Definitions:
 * 
 * - IDLE: The boss is dormant or waiting for a trigger.
 * - WANDER: The boss moves aimlessly within the area. Occurs when player is not detected. 
 *           Typical duration: 60-180 frames.
 * - CHASE: The boss has detected the player and is actively moving towards them. 
 *          This persists until the player breaks line of sight or stealths successfully.
 * - WINDUP: A visual tell before an attack. The boss stops moving and prepares to strike. 
 *           Typical duration: 40-80 frames.
 * - ATTACK: The active phase of the vine lash or strike. Damage is calculated here.
 *           Typical duration: 20-40 frames.
 * - COOLDOWN: Recovery period after an attack where the boss cannot move or attack.
 *             Typical duration: 80-120 frames.
 * - STUNNED: The boss is temporarily incapacitated (e.g., by High Beam).
 *            Typical duration: 60 frames.
 */
export type BossAIState = 'IDLE' | 'WANDER' | 'CHASE' | 'WINDUP' | 'ATTACK' | 'COOLDOWN' | 'STUNNED';

export interface VineAttack {
    active: boolean;
    targetX: number;
    targetY: number;
    progress: number; // 0 to 1 animation progress
}

export interface BossState {
  active: boolean;
  phase: 1 | 2 | 3;
  health: number;
  x: number;
  y: number;
  stunned: boolean;
  stunTimer: number;
  lastHit: number; 
  
  // AI State Machine
  aiState: BossAIState;
  stateTimer: number;
  
  // Vine System (Replaces projectiles)
  vineAttack: VineAttack;

  // Emotional System
  mutterText: string | null;
  mutterTimer: number;
}


export enum GameState {
  INTRO = 'INTRO',         
  EXPLORATION = 'EXPLORATION', 
  CORRUPTED = 'CORRUPTED', 
  BOSS_FIGHT = 'BOSS_FIGHT',
  ENDING_A = 'ENDING_A',   
  ENDING_B = 'ENDING_B',   
}

export enum RoomId {
  BUS_STOP = 'BUS_STOP',
  LOBBY = 'LOBBY',
  // STAGE removed, merged into LOBBY
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

export type EntityType = 'npc' | 'item' | 'door' | 'decoration' | 'boss_core' | 'trap' | 'save_point';

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
  
  // Door Logic
  targetRoom?: RoomId;
  targetX?: number;
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
  w: number;
  h: number;
  facingRight: boolean;
  inventory: string[];
  health: number;
  sanity: number;
}

export interface BossState {
  active: boolean;
  phase: 1 | 2 | 3;
  health: number;
  x: number;
  y: number;
  stunned: boolean;
  stunTimer: number;
}
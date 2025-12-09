
import { RoomId, RoomData, Entity } from './types';

// --- CONFIG ---
export const PLAYER_SPEED = 5;
export const SPRINT_SPEED = 9;
export const CROUCH_SPEED = 2; // Slow movement when sneaking
export const BOSS_SPEED = 2.0;
export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;

export const MAX_BATTERY = 100;
export const BATTERY_DRAIN_NORMAL = 0.05; // Drain when F is on
export const BATTERY_DRAIN_HIGH = 0.3;    // Drain when Space is held
export const BATTERY_RECHARGE_RATE = 0.0; // No auto recharge now, must manage it

export const MAX_STAMINA = 100;
export const STAMINA_DRAIN_RATE = 0.8;
export const STAMINA_RECHARGE_RATE = 0.4;

export const ATTACK_DAMAGE_BASE = 15;
export const ATTACK_COOLDOWN = 30; // Frames

// --- ITEMS ---
export const ITEMS = {
  YEARBOOK: '畢業紀念冊',
  SHARD_TROPHY: '破掉的獎狀碎片',
  SHARD_TOY: '家豪的玩具碎片',
  BELT_BUCKLE: '皮帶扣環',
  DIARY_PAGE: '家豪的日記頁',
  // Stat Items
  DUMBBELL: '生鏽的啞鈴', // +Strength
  SNEAKERS: '舊布鞋',    // +Stealth
};

// --- HELPER ---
const createDoor = (id: string, x: number, y: number, targetRoom: RoomId, targetX: number, label: string): Entity => ({
  id, type: 'door', x, y, w: 70, h: 140,
  interactable: true, visibleInNormal: true, visibleInReveal: true,
  targetRoom, targetX, label, color: '#374151'
});

const createProp = (id: string, x: number, y: number, w: number, h: number, label: string, color?: string): Entity => ({
  id, type: 'decoration', x, y, w, h,
  interactable: false, visibleInNormal: true, visibleInReveal: true,
  label, color: color || '#525252'
});

const createBreakable = (id: string, x: number, y: number, w: number, h: number, label: string): Entity => ({
  id, type: 'breakable', x, y, w, h,
  interactable: false, visibleInNormal: true, visibleInReveal: true,
  hp: 50, label, color: '#7c2d12'
});

const createVent = (id: string, x: number, y: number, targetRoom: RoomId, targetX: number): Entity => ({
  id, type: 'vent', x, y, w: 60, h: 40,
  interactable: true, visibleInNormal: true, visibleInReveal: true,
  targetRoom, targetX, label: '通風口 (蹲下)', color: '#171717'
});

// --- LEVEL DESIGN ---
export const ROOMS: Record<RoomId, RoomData> = {
  // 1. 公車站 (教學關)
  [RoomId.BUS_STOP]: {
    id: RoomId.BUS_STOP,
    name: "深夜公車站",
    width: 800,
    height: 600,
    backgroundClass: "bg-slate-900", 
    entities: [
      {
        id: 'shadow_boy_intro', type: 'npc', x: 600, y: 390, w: 40, h: 80,
        interactable: false, visibleInNormal: false, visibleInReveal: true,
        revealText: "（不可直視的殘影...似乎在指引方向）", color: '#dc2626',
        icon: 'ghost'
      },
      createProp('bus_sign', 150, 350, 20, 150, '公車站牌', '#64748b'),
      createProp('bench_broken', 400, 450, 100, 40, '長椅', '#475569'),
      createDoor('enter_school', 700, 360, RoomId.LOBBY, 50, '進入校園'),
      
      // Tutorial Items
      {
        id: ITEMS.DUMBBELL, type: 'item', x: 250, y: 460, w: 30, h: 20,
        interactable: true, visibleInNormal: true, visibleInReveal: true,
        color: '#57534e', label: '生鏽啞鈴', icon: 'fist',
        dialogue: ["撿到了「生鏽的啞鈴」。", "（雖然很重，但拿在手上讓人覺得自己更有力量。）", "【系統：力量提升！按 K 鍵可以攻擊或破壞障礙物】"]
      }
    ]
  },

  // 2. 大禮堂大廳 + 舞台 (樞紐)
  [RoomId.LOBBY]: {
    id: RoomId.LOBBY,
    name: "大禮堂",
    width: 1600, 
    height: 600,
    backgroundClass: "bg-stone-900", 
    entities: [
      // Left Side
      createDoor('to_hall_left', 50, 360, RoomId.HALL_LEFT, 700, '左側走廊'),
      createDoor('stairs_up_l', 200, 360, RoomId.SEATS_LEFT, 100, '左側樓梯 (2F)'),
      
      // Alternative Path: Blocked door to Right Hall (Needs breaking)
      createBreakable('barricade_right', 1350, 320, 40, 200, '腐朽的木板 (可破壞)'),

      // Decor
      createProp('bench_l', 150, 480, 80, 30, '積灰長椅'),
      createProp('notice_board', 300, 300, 60, 50, '公佈欄', '#78350f'),

      // --- STAGE AREA ---
      {
        id: 'curtain_left', type: 'decoration', x: 400, y: 100, w: 120, h: 500,
        interactable: false, visibleInNormal: true, visibleInReveal: true,
        label: '', color: '#7f1d1d' 
      },
      {
        id: 'curtain_right', type: 'decoration', x: 950, y: 100, w: 120, h: 500,
        interactable: false, visibleInNormal: true, visibleInReveal: true,
        label: '', color: '#7f1d1d' 
      },
      {
        id: 'lobby_sign', type: 'decoration', x: 720, y: 150, w: 100, h: 50,
        interactable: true, visibleInNormal: true, visibleInReveal: true,
        label: '校訓',
        dialogue: [
          "牆上掛著斑駁的校訓：「誠實、正直、服從」。", 
          "那個年代的學校總是這樣，壓抑得讓人喘不過氣。"
        ]
      },
      {
        id: 'jiahao_bound', type: 'npc', x: 680, y: 320, w: 100, h: 180,
        interactable: true, visibleInNormal: true, visibleInReveal: true,
        color: '#a21caf', 
        label: '被束縛的孩子',
        icon: 'flower',
        dialogue: [
          "（舞台中央，一個瘦小的身影被黑色的荊棘死死纏繞。）", 
          "（藤蔓延伸到了學校的各個角落... 必須找到源頭斬斷它們。）"
        ]
      },
      {
        id: 'boss_altar', type: 'item', x: 640, y: 500, w: 200, h: 30,
        interactable: true, visibleInNormal: true, visibleInReveal: true,
        color: '#581c87',
        label: '獻上記憶碎片',
        icon: 'altar'
      },
      
      // Right Side
      createDoor('stairs_up_r', 1250, 360, RoomId.SEATS_RIGHT, 650, '右側樓梯 (2F)'),
      createDoor('to_hall_right', 1450, 360, RoomId.HALL_RIGHT, 100, '右側走廊'),
    ]
  },

  // 4. 音控室 (事件觸發點)
  [RoomId.SOUND_ROOM]: {
    id: RoomId.SOUND_ROOM,
    name: "二樓音控室",
    width: 800,
    height: 600,
    backgroundClass: "bg-slate-800",
    entities: [
       createDoor('to_seats_left', 50, 360, RoomId.SEATS_LEFT, 700, '左側座位區'),
       createDoor('to_seats_right', 700, 360, RoomId.SEATS_RIGHT, 100, '右側座位區'),
       
       createProp('console_desk', 300, 400, 200, 60, '控制台', '#334155'),
       createProp('chair_fallen', 550, 450, 40, 40, '倒下的椅子', '#475569'),

       {
         id: ITEMS.YEARBOOK, type: 'item', x: 400, y: 380, w: 40, h: 40,
         interactable: true, visibleInNormal: true, visibleInReveal: true,
         color: '#fbbf24', label: '畢業紀念冊',
         icon: 'book',
         dialogue: [
             "（畢業紀念冊。唯獨這一頁... 是你和家豪的合照。）",
             "（你的臉是清晰的，但家豪的臉上被畫了一個巨大的紅色叉號。）",
             "（頭好痛——記憶開始瘋狂湧入！）"
         ]
       }
    ]
  },

  // 5. 房間 1：哥哥的榮耀 (2F Left)
  [RoomId.SEATS_LEFT]: {
    id: RoomId.SEATS_LEFT,
    name: "二樓左側：哥哥的榮耀",
    width: 800,
    height: 600,
    backgroundClass: "bg-red-950", 
    entities: [
      createDoor('to_lobby_sl', 50, 360, RoomId.LOBBY, 200, '下樓'),
      createDoor('to_sound_sl', 700, 360, RoomId.SOUND_ROOM, 100, '音控室'),
      
      createProp('cabinet', 250, 300, 80, 180, '獎盃櫃', '#78350f'),
      
      // Stealth Item
      {
        id: ITEMS.SNEAKERS, type: 'item', x: 150, y: 480, w: 30, h: 20,
        interactable: true, visibleInNormal: true, visibleInReveal: true,
        color: '#3b82f6', label: '舊布鞋', icon: 'shoe',
        dialogue: ["撿到了「舊布鞋」。", "（軟底的鞋子，走起路來幾乎沒有聲音。）", "【系統：潛行提升！按 C 鍵蹲下移動，敵人更難發現你】"]
      },

      {
        id: 'trophy_shelf', type: 'decoration', x: 350, y: 350, w: 150, h: 100,
        interactable: false, visibleInNormal: true, visibleInReveal: false, 
        label: '滿滿的獎盃', color: '#fcd34d'
      },
      {
        id: 'ghost_brother', type: 'npc', x: 400, y: 350, w: 60, h: 120,
        interactable: false, visibleInNormal: false, visibleInReveal: true,
        revealText: "父親怒吼：學學你哥哥啊！廢物！", color: '#ef4444',
        icon: 'shout'
      },
      {
        id: ITEMS.SHARD_TROPHY, type: 'item', x: 380, y: 480, w: 30, h: 30,
        interactable: true, visibleInNormal: false, visibleInReveal: true,
        color: '#fbbf24', label: '碎片', icon: 'shard',
        dialogue: ["撿到了「破掉的獎狀碎片」。"]
      }
    ]
  },

  // 6. 房間 2：不能哭 (2F Right)
  [RoomId.SEATS_RIGHT]: {
    id: RoomId.SEATS_RIGHT,
    name: "二樓右側：不能哭",
    width: 800,
    height: 600,
    backgroundClass: "bg-blue-950", 
    entities: [
      createDoor('to_lobby_sr', 700, 360, RoomId.LOBBY, 1250, '下樓'),
      createDoor('to_sound_sr', 50, 360, RoomId.SOUND_ROOM, 600, '音控室'),
      
      createProp('toy_box', 300, 450, 60, 40, '玩具箱', '#1e3a8a'),

      {
        id: 'broken_toys', type: 'decoration', x: 400, y: 450, w: 80, h: 40,
        interactable: false, visibleInNormal: true, visibleInReveal: true,
        label: '被踩壞的玩具', color: '#60a5fa'
      },
      {
        id: 'ghost_crying', type: 'npc', x: 420, y: 420, w: 40, h: 60,
        interactable: false, visibleInNormal: false, visibleInReveal: true,
        revealText: "（摀著嘴不敢哭出聲的孩子）", color: '#93c5fd',
        icon: 'cry'
      },
      {
        id: ITEMS.SHARD_TOY, type: 'item', x: 450, y: 460, w: 25, h: 25,
        interactable: true, visibleInNormal: false, visibleInReveal: true,
        color: '#fca5a5', label: '玩具碎片', icon: 'shard',
        dialogue: ["撿到了「家豪的玩具碎片」。"]
      }
    ]
  },

  // 7. 房間 3：父親怒氣 (1F Left)
  [RoomId.HALL_LEFT]: {
    id: RoomId.HALL_LEFT,
    name: "一樓左側：父親的皮帶",
    width: 800,
    height: 600,
    backgroundClass: "bg-orange-950",
    entities: [
      createDoor('back_lobby_hl', 700, 360, RoomId.LOBBY, 50, '大廳'),
      
      // Shortcut Vent to 1F Right (Sneak Route)
      createVent('vent_to_right', 100, 500, RoomId.HALL_RIGHT, 200),

      {
        id: 'mirror', type: 'decoration', x: 200, y: 300, w: 60, h: 100,
        interactable: false, visibleInNormal: true, visibleInReveal: true,
        label: '碎裂的鏡子', color: '#94a3b8'
      },
      {
        id: 'ghost_belt', type: 'npc', x: 300, y: 350, w: 80, h: 140,
        interactable: false, visibleInNormal: false, visibleInReveal: true,
        revealText: "（皮帶抽打的聲音不斷迴響）", color: '#7f1d1d',
        icon: 'violence'
      },
      {
        id: ITEMS.BELT_BUCKLE, type: 'item', x: 320, y: 480, w: 25, h: 25,
        interactable: true, visibleInNormal: true, visibleInReveal: true,
        color: '#d4d4d8', label: '皮帶扣', icon: 'shard',
        dialogue: ["撿到了「皮帶扣環」。"]
      }
    ]
  },

  // 8. 房間 4：藏匿 (1F Right)
  [RoomId.HALL_RIGHT]: {
    id: RoomId.HALL_RIGHT,
    name: "一樓右側：藏身處",
    width: 800,
    height: 600,
    backgroundClass: "bg-emerald-950",
    entities: [
      createDoor('back_lobby_hr', 50, 360, RoomId.LOBBY, 1450, '大廳'),
      
      // Shortcut Vent back to Left (Sneak Route)
      createVent('vent_to_left', 200, 500, RoomId.HALL_LEFT, 150),

      {
        id: 'cleaning_supplies', type: 'decoration', x: 500, y: 400, w: 80, h: 80,
        interactable: false, visibleInNormal: true, visibleInReveal: true,
        label: '清潔用具堆', color: '#15803d'
      },
      {
        id: 'ghost_hiding', type: 'npc', x: 520, y: 420, w: 40, h: 60,
        interactable: false, visibleInNormal: false, visibleInReveal: true,
        revealText: "「沒關係啦，我習慣了...」", color: '#86efac',
        icon: 'hiding'
      },
      {
        id: ITEMS.DIARY_PAGE, type: 'item', x: 600, y: 480, w: 25, h: 25,
        interactable: true, visibleInNormal: false, visibleInReveal: true,
        color: '#fef08a', label: '日記頁', icon: 'page',
        dialogue: ["撿到了「家豪的日記頁」。"]
      }
    ]
  }
};

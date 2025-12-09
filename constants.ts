import { RoomId, RoomData, Entity } from './types';

// --- CONFIG ---
export const PLAYER_SPEED = 5;
export const BOSS_SPEED = 2.0;
export const SCREEN_WIDTH = 800;
export const SCREEN_HEIGHT = 600;

// --- ITEMS ---
export const ITEMS = {
  YEARBOOK: '畢業紀念冊',
  SHARD_TROPHY: '破掉的獎狀碎片',
  SHARD_TOY: '家豪的玩具碎片',
  BELT_BUCKLE: '皮帶扣環',
  DIARY_PAGE: '家豪的日記頁',
};

// --- HELPER ---
const createDoor = (id: string, x: number, y: number, targetRoom: RoomId, targetX: number, label: string): Entity => ({
  id, type: 'door', x, y, w: 60, h: 120,
  interactable: true, visibleInNormal: true, visibleInReveal: true,
  targetRoom, targetX, label, color: '#374151'
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
        id: 'shadow_boy_intro', type: 'npc', x: 600, y: 400, w: 40, h: 80,
        interactable: false, visibleInNormal: false, visibleInReveal: true,
        revealText: "（不可直視的殘影...似乎在指引方向）", color: '#dc2626',
        icon: 'ghost'
      },
      createDoor('enter_school', 750, 380, RoomId.LOBBY, 50, '進入校園')
    ]
  },

  // 2. 大禮堂大廳 (樞紐)
  [RoomId.LOBBY]: {
    id: RoomId.LOBBY,
    name: "大禮堂一樓大廳",
    width: 1200,
    height: 600,
    backgroundClass: "bg-stone-900",
    entities: [
      // createDoor('to_stage', 550, 380, RoomId.STAGE, 100, '舞台入口'), // Removed as STAGE is removed from RoomId
      createDoor('to_hall_left', 50, 380, RoomId.HALL_LEFT, 700, '左側走廊'),
      createDoor('to_hall_right', 1100, 380, RoomId.HALL_RIGHT, 100, '右側走廊'),
      
      createDoor('stairs_up_l', 250, 380, RoomId.SEATS_LEFT, 100, '左側樓梯 (2F)'),
      createDoor('stairs_up_r', 900, 380, RoomId.SEATS_RIGHT, 650, '右側樓梯 (2F)'),

      {
        id: 'lobby_sign', type: 'decoration', x: 600, y: 300, w: 100, h: 50,
        interactable: true, visibleInNormal: true, visibleInReveal: true,
        label: '校訓',
        dialogue: ["「誠實、正直、服從」...", "「服從」兩個字被刻意刮花了。"]
      }
    ]
  },

  // 3. 舞台 (Removed from types, merged into LOBBY in data.ts)
  // [RoomId.STAGE]: { ... } removed to fix type error

  // 4. 音控室 (事件觸發點)
  [RoomId.SOUND_ROOM]: {
    id: RoomId.SOUND_ROOM,
    name: "二樓音控室",
    width: 800,
    height: 600,
    backgroundClass: "bg-slate-800",
    entities: [
       createDoor('to_seats_left', 50, 380, RoomId.SEATS_LEFT, 700, '左側座位區'),
       createDoor('to_seats_right', 700, 380, RoomId.SEATS_RIGHT, 100, '右側座位區'),
       {
         id: 'yearbook', type: 'item', x: 400, y: 400, w: 40, h: 40,
         interactable: true, visibleInNormal: true, visibleInReveal: true,
         color: '#fbbf24', label: '畢業紀念冊',
         icon: 'book',
         dialogue: [
             "（一本沾滿灰塵的畢業紀念冊。）",
             "（你翻開它... 所有的臉都被塗黑了。）",
             "（等等，這張照片... 是你和家豪？）",
             "（頭好痛——畫面開始閃爍！）"
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
      createDoor('to_lobby_sl', 50, 380, RoomId.LOBBY, 250, '下樓'),
      createDoor('to_sound_sl', 700, 380, RoomId.SOUND_ROOM, 100, '音控室'),
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
        dialogue: ["撿到了「破掉的獎狀碎片」。", "（上面還沾著乾掉的膠水，像是曾有人拼命想黏回去。）"]
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
      createDoor('to_lobby_sr', 700, 380, RoomId.LOBBY, 900, '下樓'),
      createDoor('to_sound_sr', 50, 380, RoomId.SOUND_ROOM, 600, '音控室'),
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
        dialogue: ["撿到了「家豪的玩具碎片」。", "（這是他最喜歡的超人，但頭不見了。）"]
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
      createDoor('back_lobby_hl', 700, 380, RoomId.LOBBY, 100, '大廳'),
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
        dialogue: ["撿到了「皮帶扣環」。", "（沉甸甸的金屬，冰冷得讓人不寒而慄。）"]
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
      createDoor('back_lobby_hr', 50, 380, RoomId.LOBBY, 1000, '大廳'),
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
        dialogue: ["撿到了「家豪的日記頁」。", "（字跡歪歪斜斜：哥哥什麼都好，我只會惹爸爸生氣...）"]
      }
    ]
  }
};
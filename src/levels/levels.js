const boundaryWalls = [
  { x: 0, y: 0, w: 20, h: 1 },
  { x: 0, y: 14, w: 20, h: 1 },
  { x: 0, y: 1, w: 1, h: 13 },
  { x: 19, y: 1, w: 1, h: 13 }
];

const levels = [
  {
    id: 'level-1', name: '初见', unlocked: true, grid: { width: 20, height: 15, tileSize: 32 },
    player: { x: 2, y: 2 }, exit: { x: 17, y: 12 },
    walls: [
      ...boundaryWalls,
      { x: 1, y: 7, w: 9, h: 1 },
      { x: 11, y: 7, w: 8, h: 1 }
    ],
    plates: [{ x: 5, y: 2 }],
    doors: [{ x: 10, y: 7, orientation: 'vertical', length: 1.8, plateIds: [0] }],
    lasers: [], boxes: [], maxShadows: 1
  },
  {
    id: 'level-2', name: '并行', unlocked: true, grid: { width: 20, height: 15, tileSize: 32 },
    player: { x: 2, y: 7 }, exit: { x: 17, y: 7 },
    walls: [
      ...boundaryWalls,
      { x: 14, y: 1, w: 1, h: 6 },
      { x: 14, y: 8, w: 1, h: 6 }
    ],
    plates: [{ x: 7, y: 3 }, { x: 7, y: 11 }],
    doors: [{ x: 14, y: 7, orientation: 'horizontal', plateIds: [0, 1] }],
    lasers: [], boxes: [], maxShadows: 2
  },
  {
    id: 'level-3', name: '红线', unlocked: true, grid: { width: 20, height: 15, tileSize: 32 },
    player: { x: 2, y: 7 }, exit: { x: 17, y: 7 },
    walls: [
      ...boundaryWalls,
      { x: 1, y: 1, w: 18, h: 6 },
      { x: 1, y: 8, w: 18, h: 6 }
    ],
    plates: [], doors: [],
    lasers: [{ x1: 10, y1: 6, x2: 10, y2: 8 }],
    boxes: [], maxShadows: 1
  },
  {
    id: 'level-4', name: '重量', unlocked: true, grid: { width: 20, height: 15, tileSize: 32 },
    player: { x: 2, y: 7 }, exit: { x: 17, y: 7 },
    walls: [
      ...boundaryWalls,
      { x: 14, y: 1, w: 1, h: 6 },
      { x: 14, y: 8, w: 1, h: 6 }
    ],
    plates: [{ x: 7, y: 4 }, { x: 8, y: 11 }],
    doors: [{ x: 14, y: 7, orientation: 'horizontal', plateIds: [0, 1] }],
    lasers: [], boxes: [{ x: 4, y: 4 }], maxShadows: 1
  },
  {
    id: 'level-5', name: '回声协奏', unlocked: true, grid: { width: 20, height: 15, tileSize: 32 },
    player: { x: 2, y: 7 }, exit: { x: 17, y: 7 },
    walls: [
      ...boundaryWalls,
      { x: 9, y: 1, w: 10, h: 5 },
      { x: 9, y: 9, w: 10, h: 5 }
    ],
    plates: [{ x: 6, y: 3 }, { x: 6, y: 7 }, { x: 6, y: 11 }],
    doors: [{ x: 14, y: 7, orientation: 'vertical', length: 3, plateIds: [0, 1, 2] }],
    lasers: [{ x1: 11, y1: 5, x2: 11, y2: 9 }],
    boxes: [{ x: 4, y: 3 }], maxShadows: 3
  },
  { id: 'level-6', name: '未开放区域', unlocked: false },
  { id: 'level-7', name: '未开放区域', unlocked: false },
  { id: 'level-8', name: '未开放区域', unlocked: false }
];

export default levels;

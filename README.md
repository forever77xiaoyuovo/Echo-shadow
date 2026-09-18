# 回声影子 | Echo Shadow

一个使用 Phaser 3 制作的 2D 俯视角解谜游戏。玩家每次按下 `R` 重置时，当前轮次的移动轨迹会变成一个半透明霓虹影子，影子会重复上一轮的行动。玩家需要和过去的自己协作，持续踩住压力板、打开门、推动箱子并避开激光，最后到达出口。

## 运行

环境要求：Node.js 18+。

```bash
npm install
npm run dev
```

Vite 会启动本地开发服务器，终端会显示访问地址。生产构建：

```bash
npm run build
npm run preview
```

## 玩法与操作

- 标题界面：点击画面开始游戏。
- 移动：方向键或 `WASD`。
- 重置当前轮：按 `R`。玩家回到本关起点，上一轮轨迹变成影子。
- 影子：按照录制时的每帧位置回放，可以和玩家一起激活压力板。
- 压力板：玩家、影子或箱子压住时激活。
- 门：关联的压力板全部激活后打开。
- 箱子：玩家可以推动箱子，箱子也可以压住压力板。
- 激光：玩家碰到后会重置当前轮。
- 出口：本关所有压力板激活后开启，玩家进入出口即可通关。
- 通关：按 `SPACE` 进入下一关；完成最后一关后返回标题页。

## 关卡

关卡定义位于 `src/levels/levels.js`，当前包含 5 个预置关卡：

1. `初见`：单压力板教学。
2. `并行`：两个压力板，需要影子配合。
3. `红线`：加入激光。
4. `重量`：加入可推动箱子。
5. `回声协奏`：综合关卡，最多需要 3 个影子。

每个关卡使用网格坐标，主要字段为：

```js
{
  id,
  name,
  grid: { width, height, tileSize },
  player: { x, y },
  exit: { x, y },
  walls: [{ x, y, w, h }],
  plates: [{ x, y }],
  doors: [{ x, y, orientation, plateIds }],
  lasers: [{ x1, y1, x2, y2 }],
  boxes: [{ x, y }],
  maxShadows
}
```

## 技术栈

- Phaser 3.90
- JavaScript ES modules
- Vite
- Arcade Physics
- Web Audio API 程序化音效
- Phaser Graphics 绘制全部游戏图形和粒子纹理
- 纯前端，无后端和外部图片/音频素材

## 代码架构

```text
src/
├── main.js                 # 创建 Phaser.Game
├── config.js               # Phaser、缩放和物理配置
├── scenes/
│   ├── BootScene.js        # 启动并进入标题
│   ├── TitleScene.js       # 标题和点击开始
│   ├── GameScene.js        # 当前关卡运行时、重置和通关流程
│   └── UIScene.js          # HUD、时间轴和通关界面
├── entities/
│   ├── Player.js           # 玩家输入和移动
│   ├── Shadow.js           # 录制轨迹回放
│   ├── PressurePlate.js    # 压力板状态
│   ├── Door.js              # 门和压力板关联
│   ├── Laser.js             # 激光碰撞区域
│   └── Box.js               # 可推动箱子
├── systems/
│   ├── Recorder.js         # 每帧位置录制
│   ├── LevelLoader.js       # 关卡数据到实体的转换
│   ├── AudioManager.js     # Web Audio 音效接口
│   └── VisualEffects.js    # 粒子、闪光、震动和倒带效果
└── levels/
    └── levels.js           # 五个 JSON-compatible 关卡对象
```

## 开发说明

游戏设计分辨率是 `640 x 480`，通过 Phaser Scale FIT 适配窗口。所有坐标在关卡数据中使用 tile 坐标，`LevelLoader` 负责转换为像素坐标。`GameScene` 处理游戏状态，`UIScene` 只处理屏幕空间 UI，实体类负责各自的显示和交互逻辑。

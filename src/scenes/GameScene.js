import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Shadow from '../entities/Shadow.js';
import Recorder from '../systems/Recorder.js';
import LevelLoader from '../systems/LevelLoader.js';
import AudioManager from '../systems/AudioManager.js';
import VisualEffects from '../systems/VisualEffects.js';
import levels from '../levels/levels.js';

const MAX_DEFAULT_SHADOWS = 4;
const SHADOW_COLORS = [0xb060ff, 0x9a70ff, 0xc878ff, 0x8055e8];
const LASER_BLOCK_MARGIN = 12;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data = {}) {
    this.levelIndex = Number.isInteger(data.levelIndex) ? data.levelIndex : 0;
  }

  create() {
    this.resetCursor();
    this.level = levels[this.levelIndex];

    // Locked placeholders and invalid indexes are not playable scenes.
    // Leave before reading grid data so a bad transition cannot crash create().
    if (!this.level?.unlocked || !this.level.grid || !this.level.player || !this.level.exit) {
      this.scene.start('LevelSelectScene');
      return;
    }

    this.tileSize = this.level.grid.tileSize;
    this.worldWidth = this.level.grid.width * this.tileSize;
    this.worldHeight = this.level.grid.height * this.tileSize;
    this.maxShadows = this.level.maxShadows ?? MAX_DEFAULT_SHADOWS;
    this.startX = this.level.player.x * this.tileSize + this.tileSize / 2;
    this.startY = this.level.player.y * this.tileSize + this.tileSize / 2;

    this.cameras.main.setBackgroundColor('#0a0a12');
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.audio = new AudioManager();
    this.effects = new VisualEffects(this);
    this.createGrid();

    const loaded = new LevelLoader(this).load(this.level);
    this.walls = loaded.walls;
    this.plates = loaded.plates;
    this.doors = loaded.doors;
    this.lasers = loaded.lasers;
    this.boxes = loaded.boxes;
    this.exit = loaded.exit;

    this.player = new Player(this, this.startX, this.startY);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.boxes);
    this.physics.add.collider(this.boxes, this.walls);
    this.physics.add.collider(this.boxes, this.boxes);
    this.doors.forEach((door) => {
      this.physics.add.collider(this.player, door);
      this.physics.add.collider(this.boxes, door);
    });
    this.lasers.forEach((laser) => {
      this.physics.add.overlap(this.player, laser, this.handleLaserHit, null, this);
    });

    this.shadows = [];
    this.round = 1;
    this.levelComplete = false;
    this.isResetting = false;
    this.isTransitioning = false;
    this.recorder = new Recorder(this, this.player);
    this.domKeyHandler = (event) => {
      if (event.code === 'KeyR' && !this.levelComplete) {
        event.preventDefault();
        this.resetRun();
      }
    };
    window.addEventListener('keydown', this.domKeyHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupDomKeyHandler, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);

    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.launch('UIScene');
  }

  update() {
    if (this.levelComplete) return;

    const pressureActors = [this.player, ...this.shadows, ...this.boxes.getChildren()];
    this.plates.forEach((plate) => {
      const changed = plate.updateState(pressureActors);
      if (changed && plate.isPressed) {
        this.effects.plate(plate.x, plate.y);
        this.audio.plate();
      }
    });
    this.doors.forEach((door) => door.updateState());
    this.updateExitState();
  }

  resetRun() {
    if (this.levelComplete || this.isResetting) return;

    this.isResetting = true;
    const recording = this.recorder.finish();
    if (recording.length > 0) {
      const color = SHADOW_COLORS[this.shadows.length % SHADOW_COLORS.length];
      this.shadows.push(new Shadow(this, recording, color));
    }

    while (this.shadows.length > this.maxShadows) {
      this.shadows.shift().destroy();
    }

    this.effects.reset(this.player.x, this.player.y);
    this.audio.reset();
    this.round += 1;
    this.player.setPosition(this.startX, this.startY);
    this.player.body.reset(this.startX, this.startY);
    this.player.body.setVelocity(0, 0);
    this.recorder.start();
    this.time.delayedCall(120, () => {
      this.isResetting = false;
    });
  }

  updateExitState() {
    const isOpen = this.plates.length === 0 || this.plates.every((plate) => plate.isPressed);

    if (this.exit.isActive !== isOpen) {
      this.exit.isActive = isOpen;
      this.exit.body.setFillStyle(0x3dff8c, isOpen ? 0.9 : 0.18);
      this.exit.body.setStrokeStyle(2, 0x3dff8c, isOpen ? 1 : 0.35);
      this.exit.glow.setAlpha(isOpen ? 0.35 : 0.04);
    }

    if (
      isOpen &&
      Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.exit.body.getBounds())
    ) {
      this.completeLevel();
    }
  }

  handleLaserHit(player, laser) {
    if (this.isLaserBlocked(laser)) return;

    this.resetRun();
  }

  isLaserBlocked(laser) {
    const shadowBlockers = this.shadows.filter((shadow) => shadow.blocksLaser);
    const boxBlockers = this.boxes?.getChildren?.() ?? [];
    const laserBounds = laser.getBounds();

    return [...shadowBlockers, ...boxBlockers].some((blocker) => {
      if (!blocker?.active) return false;

      // Physics resolves the laser overlap before Recorder samples that frame,
      // so the replay can stop a few pixels short of the beam.
      const blockerBounds = blocker.getBounds();
      Phaser.Geom.Rectangle.Inflate(blockerBounds, LASER_BLOCK_MARGIN, LASER_BLOCK_MARGIN);
      return Phaser.Geom.Intersects.RectangleToRectangle(blockerBounds, laserBounds);
    });
  }

  completeLevel() {
    if (this.levelComplete) return;

    this.levelComplete = true;
    this.recorder.finish();
    this.player.body.setVelocity(0, 0);
    this.audio.complete();
    this.effects.complete(this.exit.body.x, this.exit.body.y);
    this.time.timeScale = 0.35;
    this.physics.pause();
    this.events.emit('level-completed', {
      level: this.level,
      levelIndex: this.levelIndex,
      isLastLevel: this.levelIndex >= levels.length - 1
    });

    const uiScene = this.scene.get('UIScene');
    if (uiScene && uiScene.scene.isActive('UIScene')) {
      uiScene.showCompleteOverlay({
        level: this.level,
        levelIndex: this.levelIndex,
        isLastLevel: this.levelIndex >= levels.length - 1
      });
    }
  }

  nextLevel() {
    if (!this.levelComplete || this.isTransitioning) return;

    this.isTransitioning = true;
    this.time.timeScale = 1;
    this.physics.world.resume();
    const nextIndex = this.levelIndex + 1;
    this.resetCursor();

    const nextLevel = levels[nextIndex];
    if (!nextLevel?.unlocked || !nextLevel.grid || !nextLevel.player || !nextLevel.exit) {
      if (this.scene.isActive('UIScene')) {
        this.scene.stop('UIScene');
      }
      // The demo ends at the last playable level. Return to level selection
      // instead of attempting to boot a locked placeholder.
      this.scene.start('LevelSelectScene');
      return;
    }

    // Stop the parallel UI first, then restart this scene with the new index.
    // Keeping these operations in this order prevents the old UIScene and the
    // new GameScene from queuing competing launch/stop operations.
    if (this.scene.isActive('UIScene') || this.scene.isPaused('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.restart({ levelIndex: nextIndex });
  }

  // Keep the browser and Phaser cursor in sync after UI scenes are stopped.
  resetCursor() {
    this.input?.setDefaultCursor('default');
    if (this.game?.canvas) {
      this.game.canvas.style.cursor = 'default';
    }
  }

  createGrid() {
    const ground = this.add.rectangle(
      this.worldWidth / 2,
      this.worldHeight / 2,
      this.worldWidth,
      this.worldHeight,
      0x12121f,
      1
    ).setDepth(-20);

    const grid = this.add.graphics().setDepth(-18);
    grid.lineStyle(1, 0x1e1e33, 0.78);

    for (let x = -this.tileSize; x <= this.worldWidth + this.tileSize; x += this.tileSize) {
      grid.lineBetween(x, -this.tileSize, x, this.worldHeight + this.tileSize);
    }
    for (let y = -this.tileSize; y <= this.worldHeight + this.tileSize; y += this.tileSize) {
      grid.lineBetween(-this.tileSize, y, this.worldWidth + this.tileSize, y);
    }

    this.tweens.add({
      targets: grid,
      x: this.tileSize,
      y: this.tileSize * 0.5,
      duration: 24000,
      ease: 'Linear',
      repeat: -1
    });

    const noise = this.add.graphics().setDepth(-17);
    noise.fillStyle(0x8b8bad, 0.05);
    for (let index = 0; index < 200; index += 1) {
      const x = Phaser.Math.Between(8, this.worldWidth - 8);
      const y = Phaser.Math.Between(8, this.worldHeight - 8);
      noise.fillCircle(x, y, Phaser.Math.Between(1, 2));
    }

    const bandColors = [0x00f0ff, 0xb060ff, 0x3dff8c];
    bandColors.forEach((color, index) => {
      const band = this.add.graphics().setDepth(-16);
      band.lineStyle(20, color, 0.018);
      band.lineBetween(-this.worldWidth * 0.2, 0, this.worldWidth * 1.2, -54);
      band.lineStyle(1, color, 0.1);
      band.lineBetween(-this.worldWidth * 0.2, 0, this.worldWidth * 1.2, -54);

      this.tweens.add({
        targets: band,
        y: this.worldHeight + 90,
        alpha: { from: 0.25, to: 0.8 },
        duration: 15000 + index * 3500,
        delay: index * 2600,
        ease: 'Sine.InOut',
        repeat: -1
      });
    });

    const border = this.add.graphics().setDepth(-5);
    border.lineStyle(1, 0x2a2a4a, 0.9);
    border.strokeRect(4, 4, this.worldWidth - 8, this.worldHeight - 8);
    border.lineStyle(1, 0x00f0ff, 0.14);
    border.strokeRect(9, 9, this.worldWidth - 18, this.worldHeight - 18);

    const cornerSize = 18;
    border.lineStyle(2, 0x2a2a4a, 0.95);
    border.lineBetween(10, 10, 10 + cornerSize, 10);
    border.lineBetween(10, 10, 10, 10 + cornerSize);
    border.lineBetween(this.worldWidth - 10, 10, this.worldWidth - 10 - cornerSize, 10);
    border.lineBetween(this.worldWidth - 10, 10, this.worldWidth - 10, 10 + cornerSize);
    border.lineBetween(10, this.worldHeight - 10, 10 + cornerSize, this.worldHeight - 10);
    border.lineBetween(10, this.worldHeight - 10, 10, this.worldHeight - 10 - cornerSize);
    border.lineBetween(
      this.worldWidth - 10,
      this.worldHeight - 10,
      this.worldWidth - 10 - cornerSize,
      this.worldHeight - 10
    );
    border.lineBetween(
      this.worldWidth - 10,
      this.worldHeight - 10,
      this.worldWidth - 10,
      this.worldHeight - 10 - cornerSize
    );

    const nodePositions = [
      [14, 14],
      [this.worldWidth - 14, 14],
      [14, this.worldHeight - 14],
      [this.worldWidth - 14, this.worldHeight - 14]
    ];
    nodePositions.forEach(([x, y], index) => {
      const node = this.add.graphics().setDepth(-4);
      node.fillStyle(0x00f0ff, 0.3);
      node.fillCircle(x, y, 4);
      node.lineStyle(1, 0x00f0ff, 0.5);
      node.strokeCircle(x, y, 8);
      node.setBlendMode(Phaser.BlendModes.ADD);

      this.tweens.add({
        targets: node,
        alpha: { from: 0.35, to: 0.9 },
        scale: { from: 0.85, to: 1.2 },
        duration: 1800 + index * 180,
        ease: 'Sine.InOut',
        yoyo: true,
        repeat: -1
      });
    });
  }

  cleanupDomKeyHandler() {
    if (!this.domKeyHandler) return;
    window.removeEventListener('keydown', this.domKeyHandler);
    this.domKeyHandler = null;
  }

  cleanupScene() {
    this.resetCursor();

    if (this.time) {
      this.time.timeScale = 1;
      this.time.removeAllEvents?.();
    }
    if (this.physics?.world?.resume) {
      this.physics.world.resume();
    }
    this.tweens?.killAll?.();
    this.shadows?.forEach((shadow) => {
      if (shadow?.scene?.sys && typeof shadow.destroy === 'function') {
        shadow.destroy();
      }
    });
    this.shadows = [];
    if (this.recorder?.scene?.events && typeof this.recorder.destroy === 'function') {
      this.recorder.destroy();
    }
    this.recorder = null;
  }
}

import Phaser from 'phaser';
import levels from '../levels/levels.js';

const WIDTH = 640;
const HEIGHT = 480;
const OPEN_COLOR = 0x00f0ff;
const LOCKED_COLOR = 0x3a3a5a;

/** Level selection screen. It only chooses a level; gameplay stays in GameScene. */
export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this.input.setDefaultCursor('default');
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0a0a12);
    this.add.text(WIDTH / 2, 58, '选择关卡', {
      color: '#00f0ff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      shadow: { blur: 10, color: '#00f0ff', fill: true }
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 92, '选择一个已开放的回声节点', {
      color: '#8e96af',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    }).setOrigin(0.5);

    levels.forEach((level, index) => this.createLevelCard(level, index));

    this.backButton = this.add.rectangle(WIDTH / 2, 438, 180, 38, 0x131429, 0.96)
      .setStrokeStyle(2, OPEN_COLOR, 0.8)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.returnToTitle, this);
    this.add.text(WIDTH / 2, 438, '返回标题', {
      color: '#00f0ff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  createLevelCard(level, index) {
    const unlocked = level.unlocked === true;
    const columns = 4;
    const cardWidth = 128;
    const cardHeight = 104;
    const gapX = 18;
    const gapY = 16;
    const row = Math.floor(index / columns);
    const column = index % columns;
    const x = 92 + column * (cardWidth + gapX);
    const y = 150 + row * (cardHeight + gapY);
    const color = unlocked ? OPEN_COLOR : LOCKED_COLOR;
    const fill = unlocked ? 0x101b2b : 0x11111c;

    const card = this.add.rectangle(x, y, cardWidth, cardHeight, fill, 0.96)
      .setStrokeStyle(2, color, unlocked ? 0.85 : 0.65)
      .setDepth(2);

    const glow = this.add.rectangle(x, y, cardWidth + 8, cardHeight + 8, color, unlocked ? 0.04 : 0.015)
      .setDepth(1);

    this.add.text(x, y - 28, level.id, {
      color: unlocked ? '#dbe8ff' : '#686b7d',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.add.text(x, y - 5, level.name, {
      color: unlocked ? '#ffffff' : '#686b7d',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px'
    }).setOrigin(0.5).setDepth(3);

    this.add.text(x, y + 26, unlocked ? '进入关卡' : '锁定 · 未开放', {
      color: unlocked ? '#00f0ff' : '#686b7d',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px'
    }).setOrigin(0.5).setDepth(3);

    if (unlocked) {
      card.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        // The locked placeholders intentionally have no playable definition.
        // Only pass indexes for fully defined, explicitly unlocked levels.
        if (level.unlocked !== true || !level.grid || !level.player || !level.exit) return;
        this.scene.start('GameScene', { levelIndex: index });
      });
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.03, to: 0.12 },
        duration: 1300 + index * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    }
  }

  returnToTitle() {
    this.scene.start('TitleScene');
  }

  cleanup() {
    this.input.setDefaultCursor('default');
    if (this.game?.canvas) this.game.canvas.style.cursor = 'default';
  }
}

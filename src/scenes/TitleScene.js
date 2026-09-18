import Phaser from 'phaser';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // A title-screen start always begins a fresh run at level 1.
    this.levelIndex = 0;
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a12);

    this.add.text(width / 2, height * 0.36, '回声影子', {
      color: '#00f0ff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      shadow: { blur: 14, color: '#00f0ff', fill: true, stroke: true, offsetX: 0, offsetY: 0 }
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.49, 'ECHO SHADOW', {
      color: '#b060ff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.7, '点击屏幕开始', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px'
    }).setOrigin(0.5);

    this.add
      .zone(width / 2, height / 2, width, height)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', this.startGame, this);
  }

  startGame() {
    if (this.scene.isActive('LevelSelectScene')) return;
    this.scene.start('LevelSelectScene');
  }
}

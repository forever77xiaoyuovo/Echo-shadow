import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 640,
  height: 480,
  backgroundColor: '#0a0a12',
  render: {
    antialias: true,
    pixelArt: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 640,
    height: 480
  },
  scene: [BootScene, TitleScene, LevelSelectScene, GameScene, UIScene]
};

export default gameConfig;

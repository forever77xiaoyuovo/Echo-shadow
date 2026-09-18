import Phaser from 'phaser';

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 480;
const SHADOW_COLORS = [0xb060ff, 0x9a70ff, 0xc878ff, 0x8055e8];

/** Screen-space HUD for the active GameScene. */
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.gameScene = this.scene.get('GameScene');
    this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');
    this.completeShown = false;
    this.isAdvancing = false;
    this.isReturning = false;
    this.returnTimer = null;
    this.levelCompleteHandler = (data) => this.showCompleteOverlay(data);
    this.gameScene.events.on('level-completed', this.levelCompleteHandler, this);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.spaceKey.on('down', this.handleContinue, this);
    this.domKeyHandler = (event) => {
      if (event.code === 'Escape') {
        event.preventDefault();
        this.returnToTitle();
        return;
      }
      if (event.code === 'Space' && this.completeShown) {
        event.preventDefault();
        this.handleContinue();
      }
    };
    window.addEventListener('keydown', this.domKeyHandler);
    this.domPointerHandler = () => {
      if (this.completeShown) {
        this.handleContinue();
      }
    };
    // Phaser input can be affected by multiple active scenes. Capture the
    // browser pointer event as a reliable fallback while the win overlay is up.
    window.addEventListener('pointerdown', this.domPointerHandler, true);
    this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escapeKey.on('down', this.returnToTitle, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.createHud();
    this.createTimeline();
  }

  update() {
    if (!this.gameScene || !this.gameScene.scene.isActive('GameScene')) return;
    this.updateHud();
    this.updateTimeline();

    // Covers the case where GameScene completed before UIScene subscribed.
    if (this.gameScene.levelComplete && !this.completeShown) {
      this.showCompleteOverlay({
        isLastLevel: this.gameScene.levelIndex >= 4
      });
    }
  }

  createHud() {
    this.panel = this.add.rectangle(0, 0, VIEW_WIDTH, 58, 0x0a0a12, 0.72).setOrigin(0, 0).setDepth(1);
    this.levelText = this.add.text(16, 8, '', {
      color: '#dbe8ff', fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold'
    }).setDepth(2);
    this.statusText = this.add.text(16, 31, '', {
      color: '#a9b0c6', fontFamily: 'Arial, sans-serif', fontSize: '13px'
    }).setDepth(2);
  }

  createTimeline() {
    this.timelinePanel = this.add.rectangle(0, VIEW_HEIGHT - 42, VIEW_WIDTH, 42, 0x0a0a12, 0.84).setOrigin(0, 0).setDepth(1);
    this.timelineLabel = this.add.text(16, 450, '时间轴', {
      color: '#8e96af', fontFamily: 'Arial, sans-serif', fontSize: '12px'
    }).setDepth(2);
    this.timelineGraphics = this.add.graphics().setDepth(2);
  }

  showCompleteOverlay(data) {
    if (this.completeShown) return;
    this.completeShown = true;
    const { level } = this.gameScene;
    const lastLevel = Boolean(data?.isLastLevel);
    this.isLastLevel = lastLevel;

    this.completeBackdrop = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_WIDTH, VIEW_HEIGHT, 0x0a0a12, 0.78)
      .setDepth(10)
      .setInteractive()
      .on('pointerdown', this.handleContinue, this);
    this.completePanel = this.add.rectangle(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, 430, 176, 0x131429, 0.96)
      .setStrokeStyle(2, 0x3dff8c, 0.65)
      .setDepth(11);
    this.completeTitle = this.add.text(VIEW_WIDTH / 2, 202, lastLevel ? '全部通关' : `通关：${level.name}`, {
      color: '#3dff8c',
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(12);
    this.completePrompt = this.add.text(VIEW_WIDTH / 2, 267, lastLevel ? '点击返回标题' : '3 秒后自动进入下一关', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px'
    }).setOrigin(0.5).setDepth(12);

    // The visible button owns the hit area so text, depth, and transparent layers
    // cannot leave an invisible Zone responsible for the transition.
    this.continueButton = this.add.rectangle(VIEW_WIDTH / 2, 310, 230, 42, 0x3dff8c, 0.16)
      .setStrokeStyle(2, 0x3dff8c, 0.9)
      .setDepth(12)
      .setInteractive()
      .on('pointerdown', this.handleContinue, this);
    this.continueButtonLabel = this.add.text(VIEW_WIDTH / 2, 310, lastLevel ? '返回标题' : '进入下一关', {
      color: '#3dff8c',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(13);

    this.tweens.add({
      targets: [this.completePanel, this.completeTitle, this.completePrompt],
      alpha: { from: 0, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.easeInOut'
    });

    // Keep level progression independent from pointer and keyboard focus.
    // The first-level completion screen is intentionally temporary.
    if (!lastLevel) {
      this.autoAdvanceTimer = this.time.delayedCall(3000, this.handleContinue, [], this);
    }
  }

  returnToTitle() {
    if (this.isReturning || !this.gameScene) return;

    this.isReturning = true;
    const gameScene = this.gameScene;
    this.time.timeScale = 1;
    this.returnTimer = window.setTimeout(() => {
      this.returnTimer = null;
      if (gameScene.scene.isActive('UIScene')) gameScene.scene.stop('UIScene');
      if (gameScene.scene.isActive('GameScene')) gameScene.scene.start('TitleScene');
    }, 0);
  }

  handleContinue() {
    if (!this.completeShown || this.isAdvancing || !this.gameScene) return;
    this.isAdvancing = true;
    this.input.setDefaultCursor('default');
    // Call the owning scene directly. This avoids losing the request when the
    // UI scene is shutting down or when a stale event target is present.
    this.continueButton.disableInteractive();
    this.completeBackdrop.disableInteractive();
    const gameScene = this.gameScene;
    // Do not stop/restart scenes from inside Phaser's pointer dispatch.
    this.transitionTimer = window.setTimeout(() => {
      this.transitionTimer = null;
      gameScene?.nextLevel();
    }, 0);
  }

  cleanup() {
    if (this.domKeyHandler) {
      window.removeEventListener('keydown', this.domKeyHandler);
      this.domKeyHandler = null;
    }
    if (this.domPointerHandler) {
      window.removeEventListener('pointerdown', this.domPointerHandler, true);
      this.domPointerHandler = null;
    }
    if (this.transitionTimer !== null && this.transitionTimer !== undefined) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
    if (this.returnTimer !== null && this.returnTimer !== undefined) {
      window.clearTimeout(this.returnTimer);
      this.returnTimer = null;
    }
    this.autoAdvanceTimer?.remove(false);
    this.autoAdvanceTimer = null;
    if (this.gameScene && this.levelCompleteHandler) {
      this.gameScene.events.off('level-completed', this.levelCompleteHandler, this);
      this.levelCompleteHandler = null;
    }
    this.spaceKey?.off('down', this.handleContinue, this);
    this.escapeKey?.off('down', this.returnToTitle, this);
    if (this.continueButton?.scene?.sys) {
      this.continueButton.off('pointerdown', this.handleContinue, this);
      this.continueButton.disableInteractive();
    }
    if (this.completeBackdrop?.scene?.sys) {
      this.completeBackdrop.off('pointerdown', this.handleContinue, this);
      this.completeBackdrop.disableInteractive();
    }
    this.input.setDefaultCursor('default');
    if (this.game?.canvas) {
      this.game.canvas.style.cursor = 'default';
    }
    this.tweens.killAll();
    this.gameScene = null;
  }

  updateHud() {
    const { level, round, shadows, maxShadows } = this.gameScene;
    if (!level) return;

    this.levelText.setText(`${level.id}  |  ${level.name}`);
    this.statusText.setText(`轮次 ${round}  |  影子 ${shadows.length}/${maxShadows}  |  R 重置`);
  }

  updateTimeline() {
    const { shadows, round } = this.gameScene;
    this.timelineGraphics.clear();
    this.timelineGraphics.lineStyle(1, 0x343550, 1);
    this.timelineGraphics.strokeRect(88, VIEW_HEIGHT - 32, 536, 22);

    for (let index = 0; index < shadows.length; index += 1) {
      const color = SHADOW_COLORS[index % SHADOW_COLORS.length];
      const x = 94 + index * 33;
      this.timelineGraphics.fillStyle(color, 0.8);
      this.timelineGraphics.fillRect(x, VIEW_HEIGHT - 27, 25, 12);
    }

    this.timelineGraphics.fillStyle(0x00f0ff, 0.92);
    this.timelineGraphics.fillRect(Math.min(94 + shadows.length * 33, 594), VIEW_HEIGHT - 12, 24, 2);
    this.timelineLabel.setText(`时间轴  R${round}`);
  }
}

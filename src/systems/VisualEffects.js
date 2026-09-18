import Phaser from 'phaser';

const PARTICLE_TEXTURE = 'echo-shadow-particle';

/** Creates reusable camera, flash, shake, and particle effects. */
export default class VisualEffects {
  constructor(scene) {
    this.scene = scene;
    this.createParticleTexture();
    this.rewindOverlay = scene.add.rectangle(320, 240, 640, 480, 0xb060ff, 0)
      .setScrollFactor(0)
      .setDepth(30);
    this.rewindLabel = scene.add.text(320, 240, 'REWIND', {
      color: '#e2c5ff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(31);
    this.emitter = scene.add.particles(0, 0, PARTICLE_TEXTURE, {
      active: false,
      emitting: false,
      lifespan: { min: 260, max: 620 },
      speed: { min: 50, max: 180 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 0.9, end: 0 },
      rotate: { min: 0, max: 360 },
      quantity: 16,
      gravityY: 0,
      blendMode: 'ADD'
    }).setDepth(18);
  }

  createParticleTexture() {
    if (this.scene.textures.exists(PARTICLE_TEXTURE)) return;

    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(6, 6, 6);
    graphics.generateTexture(PARTICLE_TEXTURE, 12, 12);
    graphics.destroy();
  }

  burst(x, y, color = 0xb060ff, quantity = 16) {
    if (!this.emitter || !this.emitter.active) return;
    this.emitter.setParticleTint(color);
    this.emitter.explode(quantity, x, y);
  }

  reset(x, y) {
    this.burst(x, y, 0xb060ff, 24);
    this.scene.cameras.main.shake(180, 0.008);
    this.scene.cameras.main.flash(100, 176, 96, 255, false);
    this.rewindOverlay.setAlpha(0.18);
    this.rewindLabel.setAlpha(1);
    this.scene.tweens.add({
      targets: [this.rewindOverlay, this.rewindLabel],
      alpha: 0,
      duration: 260,
      ease: 'Cubic.easeOut'
    });
  }

  plate(x, y) {
    this.burst(x, y, 0xffd93d, 12);
  }

  complete(x, y) {
    this.burst(x, y, 0x3dff8c, 42);
    this.scene.cameras.main.flash(380, 61, 255, 140, false);
    this.scene.cameras.main.zoomTo(1.045, 420, 'Sine.easeOut');
  }
}

import Phaser from 'phaser';

const SHADOW_SIZE = 22;
const TRAIL_LENGTH = 10;

/**
 * Replays one completed player recording. Shadows are visual-only for now;
 * later gameplay systems can add their own interaction body if needed.
 */
export default class Shadow extends Phaser.GameObjects.Rectangle {
  constructor(scene, frames, color = 0xb060ff) {
    const firstFrame = frames[0] || { x: 0, y: 0 };
    super(scene, firstFrame.x, firstFrame.y, SHADOW_SIZE, SHADOW_SIZE, color, 0.42);

    this.frames = frames;
    this.frameIndex = 0;
    this.color = color;
    this.blocksLaser = true;
    this.trail = [];

    scene.add.existing(this);
    this.setDepth(5);
    this.setStrokeStyle(2, 0xe2c5ff, 0.72);

    this.trailGraphics = scene.add.graphics().setDepth(4);
    this.blockingHalo = scene.add.graphics().setDepth(6);
    this.updateTrail();

    scene.events.on('update', this.replay, this);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updateBlockingVisual, this);
    this.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
  }

  replay() {
    if (!this.active || this.frames.length === 0) return;

    const frame = this.frames[Math.min(this.frameIndex, this.frames.length - 1)];
    this.setPosition(frame.x, frame.y);
    this.trail.push({ x: frame.x, y: frame.y });

    if (this.trail.length > TRAIL_LENGTH) {
      this.trail.shift();
    }

    this.updateTrail();

    if (this.frameIndex < this.frames.length - 1) {
      this.frameIndex += 1;
    }
  }

  updateTrail() {
    this.trailGraphics.clear();

    for (let index = 0; index < this.trail.length; index += 1) {
      const point = this.trail[index];
      const age = this.trail.length - index;
      const alpha = 0.24 * (1 - age / (TRAIL_LENGTH + 1));
      const size = 8 + (TRAIL_LENGTH - age);

      this.trailGraphics.fillStyle(this.color, Math.max(0.035, alpha));
      this.trailGraphics.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    }
  }

  updateBlockingVisual() {
    if (!this.active || !this.scene || !this.blockingHalo) return;

    const isBlocking = this.blocksLaser && (
      this.scene.lasers?.some((laser) => laser?.active && laser.isBlockedBy?.(this)) ?? false
    );

    this.blockingHalo.clear();
    if (!isBlocking) return;

    const pulse = 1 + Math.sin(this.scene.time.now * 0.018) * 0.12;
    this.blockingHalo.fillStyle(0x8dfff3, 0.08);
    this.blockingHalo.fillCircle(this.x, this.y, 20 * pulse);
    this.blockingHalo.lineStyle(2, 0x8dfff3, 0.9);
    this.blockingHalo.strokeCircle(this.x, this.y, 18 * pulse);
    this.blockingHalo.lineStyle(1, this.color, 0.75);
    this.blockingHalo.strokeCircle(this.x, this.y, 23 * pulse);
  }

  onDestroy() {
    this.scene.events.off('update', this.replay, this);
    this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.updateBlockingVisual, this);
    this.trailGraphics.destroy();
    this.blockingHalo.destroy();
    this.frames = [];
    this.trail = [];
  }
}

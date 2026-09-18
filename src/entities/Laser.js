import Phaser from 'phaser';

const LASER_COLOR = 0xff3355;
const LASER_GLOW = 0xff7a8f;
const BLOCKED_COLOR = 0x8dfff3;
const LASER_THICKNESS = 8;
const BLOCK_MARGIN = 12;
const GAP_PADDING = 6;

/**
 * Tile-based laser beam. Arcade physics uses a thin rectangular hitbox.
 */
export default class Laser extends Phaser.GameObjects.Rectangle {
  constructor(scene, x1, y1, x2, y2, tileSize = 32) {
    const startX = x1 * tileSize + tileSize / 2;
    const startY = y1 * tileSize + tileSize / 2;
    const endX = x2 * tileSize + tileSize / 2;
    const endY = y2 * tileSize + tileSize / 2;
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const width = x1 === x2 ? LASER_THICKNESS : Math.abs(x2 - x1) * tileSize + tileSize;
    const height = y1 === y2 ? LASER_THICKNESS : Math.abs(y2 - y1) * tileSize + tileSize;

    super(scene, centerX, centerY, width, height, LASER_COLOR, 0);

    this.isVertical = x1 === x2;
    this.wasPlayerPassingBlocked = false;
    this.glow = scene.add.rectangle(centerX, centerY, width + 8, height + 8, LASER_GLOW, 0).setDepth(3);
    this.beamGraphics = scene.add.graphics().setDepth(7);
    this.sparkGraphics = scene.add.graphics().setDepth(8);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setDepth(7);
    this.body.updateFromGameObject();
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updateVisuals, this);
  }

  getBlockers() {
    const shadows = this.scene.shadows?.filter((shadow) => shadow.blocksLaser) ?? [];
    const boxGroup = this.scene.boxes;
    const boxes = boxGroup?.children?.entries ? boxGroup.getChildren() : [];
    return [...shadows, ...boxes].filter((blocker) => blocker?.active);
  }

  isBlockedBy(blocker) {
    if (!blocker?.active || typeof blocker.getBounds !== 'function') return false;

    const blockerBounds = blocker.getBounds();
    Phaser.Geom.Rectangle.Inflate(blockerBounds, BLOCK_MARGIN, BLOCK_MARGIN);
    return Phaser.Geom.Intersects.RectangleToRectangle(blockerBounds, this.getBounds());
  }

  getBlockedIntervals() {
    const beamBounds = this.getBounds();
    const intervals = this.getBlockers()
      .filter((blocker) => this.isBlockedBy(blocker))
      .map((blocker) => {
        const bounds = blocker.getBounds();
        const start = this.isVertical ? bounds.top : bounds.left;
        const end = this.isVertical ? bounds.bottom : bounds.right;
        const beamStart = this.isVertical ? beamBounds.top : beamBounds.left;
        const beamEnd = this.isVertical ? beamBounds.bottom : beamBounds.right;

        return {
          start: Phaser.Math.Clamp(start - GAP_PADDING, beamStart, beamEnd),
          end: Phaser.Math.Clamp(end + GAP_PADDING, beamStart, beamEnd)
        };
      })
      .sort((a, b) => a.start - b.start);

    return intervals.reduce((merged, interval) => {
      const previous = merged[merged.length - 1];
      if (!previous || interval.start > previous.end) {
        merged.push({ ...interval });
      } else {
        previous.end = Math.max(previous.end, interval.end);
      }
      return merged;
    }, []);
  }

  drawBeamSegment(start, end, bounds) {
    if (end <= start) return;

    this.beamGraphics.fillStyle(LASER_GLOW, 0.18);
    if (this.isVertical) {
      this.beamGraphics.fillRect(bounds.centerX - 8, start, 16, end - start);
      this.beamGraphics.fillStyle(LASER_COLOR, 0.82);
      this.beamGraphics.fillRect(bounds.centerX - LASER_THICKNESS / 2, start, LASER_THICKNESS, end - start);
    } else {
      this.beamGraphics.fillRect(start, bounds.centerY - 8, end - start, 16);
      this.beamGraphics.fillStyle(LASER_COLOR, 0.82);
      this.beamGraphics.fillRect(start, bounds.centerY - LASER_THICKNESS / 2, end - start, LASER_THICKNESS);
    }
  }

  drawBlockingSpark(position, bounds, alpha) {
    this.sparkGraphics.fillStyle(BLOCKED_COLOR, alpha);
    this.sparkGraphics.lineStyle(2, BLOCKED_COLOR, alpha);

    if (this.isVertical) {
      this.sparkGraphics.fillCircle(bounds.centerX, position, 3);
      this.sparkGraphics.lineBetween(bounds.centerX - 9, position - 5, bounds.centerX - 4, position);
      this.sparkGraphics.lineBetween(bounds.centerX + 4, position, bounds.centerX + 9, position + 5);
    } else {
      this.sparkGraphics.fillCircle(position, bounds.centerY, 3);
      this.sparkGraphics.lineBetween(position - 5, bounds.centerY - 9, position, bounds.centerY - 4);
      this.sparkGraphics.lineBetween(position, bounds.centerY + 4, position + 5, bounds.centerY + 9);
    }
  }

  updateVisuals() {
    if (!this.active || !this.scene) return;

    const bounds = this.getBounds();
    const intervals = this.getBlockedIntervals();
    const beamStart = this.isVertical ? bounds.top : bounds.left;
    const beamEnd = this.isVertical ? bounds.bottom : bounds.right;
    const sparkAlpha = 0.65 + Math.sin(this.scene.time.now * 0.02) * 0.25;

    this.beamGraphics.clear();
    this.sparkGraphics.clear();

    let cursor = beamStart;
    intervals.forEach((interval) => {
      this.drawBeamSegment(cursor, interval.start, bounds);
      this.drawBlockingSpark(interval.start, bounds, sparkAlpha);
      this.drawBlockingSpark(interval.end, bounds, sparkAlpha);
      cursor = interval.end;
    });
    this.drawBeamSegment(cursor, beamEnd, bounds);

    const player = this.scene.player;
    const playerPassingBlocked = intervals.length > 0 && player?.active &&
      Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), bounds);

    if (playerPassingBlocked) {
      this.sparkGraphics.lineStyle(2, BLOCKED_COLOR, 0.9);
      this.sparkGraphics.strokeCircle(player.x, player.y, 17);
      if (!this.wasPlayerPassingBlocked) {
        this.scene.cameras.main.flash(90, 141, 255, 243, false);
      }
    }
    this.wasPlayerPassingBlocked = playerPassingBlocked;
  }

  destroy(fromScene) {
    this.scene?.events?.off(Phaser.Scenes.Events.POST_UPDATE, this.updateVisuals, this);
    this.glow?.destroy();
    this.beamGraphics?.destroy();
    this.sparkGraphics?.destroy();
    super.destroy(fromScene);
  }
}

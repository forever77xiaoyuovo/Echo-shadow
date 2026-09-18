import Phaser from 'phaser';

const PLATE_COLOR = 0xffd93d;
const PLATE_GLOW = 0xfff3a3;

/**
 * A pressure plate is active while any tracked actor overlaps it.
 * Actors can be players, visual shadows, or physics boxes.
 */
export default class PressurePlate extends Phaser.GameObjects.Rectangle {
  constructor(scene, tileX, tileY, tileSize = 32) {
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;
    super(scene, x, y, tileSize * 0.75, tileSize * 0.75, PLATE_COLOR, 0.35);

    this.isPressed = false;
    this.tileX = tileX;
    this.tileY = tileY;

    this.glow = scene.add.rectangle(x, y, tileSize, tileSize, PLATE_COLOR, 0.06).setDepth(1);
    scene.add.existing(this);
    this.setDepth(2);
    this.setStrokeStyle(2, PLATE_GLOW, 0.7);
  }

  updateState(actors) {
    const wasPressed = this.isPressed;
    // Plates only observe overlap; they never move or snap the actors on them.
    this.isPressed = actors.some((actor) => this.overlapsActor(actor));

    if (this.isPressed !== wasPressed) {
      this.updateVisualState();
    }

    return this.isPressed !== wasPressed;
  }

  overlapsActor(actor) {
    if (!actor || !actor.active || typeof actor.getBounds !== 'function') return false;
    return Phaser.Geom.Intersects.RectangleToRectangle(this.getBounds(), actor.getBounds());
  }

  updateVisualState() {
    this.setFillStyle(PLATE_COLOR, this.isPressed ? 0.95 : 0.35);
    this.setStrokeStyle(2, PLATE_GLOW, this.isPressed ? 1 : 0.7);
    this.glow.setAlpha(this.isPressed ? 0.24 : 0.06);
  }

  destroy(fromScene) {
    this.glow.destroy();
    super.destroy(fromScene);
  }
}

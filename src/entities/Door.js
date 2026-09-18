import Phaser from 'phaser';

const DOOR_COLOR = 0xff8c42;
const DOOR_GLOW = 0xffc08a;

/**
 * A static blocking door that opens when every linked pressure plate is active.
 */
export default class Door extends Phaser.GameObjects.Rectangle {
  constructor(scene, tileX, tileY, orientation = 'vertical', tileSize = 32, length = 1, linkedPlates = []) {
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;
    const isVertical = orientation === 'vertical';
    const width = isVertical ? tileSize * 0.42 : tileSize;
    const height = isVertical ? tileSize * length : tileSize * 0.42;

    super(scene, x, y, width, height, DOOR_COLOR, 1);

    this.orientation = orientation;
    this.linkedPlates = linkedPlates;
    this.isOpen = null;

    this.glow = scene.add.rectangle(x, y, width + 10, height + 10, DOOR_COLOR, 0.16).setDepth(3);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.setDepth(4);
    this.setStrokeStyle(2, DOOR_GLOW, 1);
    this.body.updateFromGameObject();
    this.setOpen(false);
  }

  setLinkedPlates(plates) {
    this.linkedPlates = plates;
    this.updateState();
  }

  updateState() {
    const shouldOpen = this.linkedPlates.length > 0 && this.linkedPlates.every((plate) => plate.isPressed);
    this.setOpen(shouldOpen);
  }

  setOpen(isOpen) {
    if (this.isOpen === isOpen) return;

    this.isOpen = isOpen;
    this.body.enable = !isOpen;
    this.setAlpha(isOpen ? 0.18 : 1);
    this.setFillStyle(DOOR_COLOR, isOpen ? 0.18 : 1);
    this.setStrokeStyle(2, DOOR_GLOW, isOpen ? 0.35 : 1);
    this.glow.setAlpha(isOpen ? 0.03 : 0.16);
  }

  destroy(fromScene) {
    this.glow.destroy();
    super.destroy(fromScene);
  }
}

import Phaser from 'phaser';

const BOX_COLOR = 0x6f6a8f;
const BOX_EDGE = 0xc7c4ff;
const CONTACT_TOLERANCE = 6;

/**
 * Pushable Arcade physics box. It can hold pressure plates when moved onto one.
 */
export default class Box extends Phaser.GameObjects.Rectangle {
  constructor(scene, tileX, tileY, tileSize = 32) {
    const x = tileX * tileSize + tileSize / 2;
    const y = tileY * tileSize + tileSize / 2;
    super(scene, x, y, tileSize * 0.82, tileSize * 0.82, BOX_COLOR, 1);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(6);
    this.setStrokeStyle(2, BOX_EDGE, 0.85);
    this.tileSize = tileSize;
    this.pushKeys = { left: false, right: false, up: false, down: false };
    this.body.setSize(tileSize * 0.82, tileSize * 0.82);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0);
    this.lockPhysicsBody();

    scene.events.on('update', this.updatePush, this);
  }

  updatePush() {
    this.lockPhysicsBody();

    const player = this.scene?.player;
    if (!player?.active || !player.body || this.scene.levelComplete) return;

    const directions = [
      { name: 'left', dx: -1, dy: 0, down: player.cursors.left.isDown || player.keys.left.isDown },
      { name: 'right', dx: 1, dy: 0, down: player.cursors.right.isDown || player.keys.right.isDown },
      { name: 'up', dx: 0, dy: -1, down: player.cursors.up.isDown || player.keys.up.isDown },
      { name: 'down', dx: 0, dy: 1, down: player.cursors.down.isDown || player.keys.down.isDown }
    ];

    let command = null;
    directions.forEach((direction) => {
      if (direction.down && !this.pushKeys[direction.name] && !command) {
        command = direction;
      }
      this.pushKeys[direction.name] = direction.down;
    });

    if (command) {
      this.tryPush(player, command.dx, command.dy);
    }
  }

  tryPush(player, dx, dy) {
    if (!this.isPlayerInPushPosition(player, dx, dy)) return false;

    const targetX = this.x + dx * this.tileSize;
    const targetY = this.y + dy * this.tileSize;
    const targetBounds = new Phaser.Geom.Rectangle(
      targetX - this.width / 2,
      targetY - this.height / 2,
      this.width,
      this.height
    );

    if (this.isTargetBlocked(targetBounds)) return false;

    this.body.reset(targetX, targetY);
    this.lockPhysicsBody();
    return true;
  }

  /** Keep Arcade Physics from adding movement between discrete grid pushes. */
  lockPhysicsBody() {
    if (!this.body) return;

    this.body.stop();
    this.body.setImmovable(true);
    this.body.moves = false;
  }

  isPlayerInPushPosition(player, dx, dy) {
    const playerBounds = player.getBounds();
    const boxBounds = this.getBounds();
    const overlapX = Math.min(playerBounds.right, boxBounds.right) - Math.max(playerBounds.left, boxBounds.left);
    const overlapY = Math.min(playerBounds.bottom, boxBounds.bottom) - Math.max(playerBounds.top, boxBounds.top);

    if (dx > 0) {
      return player.x < this.x && overlapY > player.height / 2 &&
        boxBounds.left - playerBounds.right <= CONTACT_TOLERANCE;
    }
    if (dx < 0) {
      return player.x > this.x && overlapY > player.height / 2 &&
        playerBounds.left - boxBounds.right <= CONTACT_TOLERANCE;
    }
    if (dy > 0) {
      return player.y < this.y && overlapX > player.width / 2 &&
        boxBounds.top - playerBounds.bottom <= CONTACT_TOLERANCE;
    }
    return player.y > this.y && overlapX > player.width / 2 &&
      playerBounds.top - boxBounds.bottom <= CONTACT_TOLERANCE;
  }

  isTargetBlocked(targetBounds) {
    const worldBounds = this.scene.physics.world.bounds;
    if (!Phaser.Geom.Rectangle.ContainsRect(worldBounds, targetBounds)) return true;

    const walls = this.scene.walls?.getChildren?.() ?? [];
    const closedDoors = (this.scene.doors ?? []).filter((door) => door.body?.enable);
    const otherBoxes = (this.scene.boxes?.getChildren?.() ?? []).filter((box) => box !== this);

    return [...walls, ...closedDoors, ...otherBoxes].some((obstacle) => (
      obstacle?.active &&
      Phaser.Geom.Intersects.RectangleToRectangle(targetBounds, obstacle.getBounds())
    ));
  }

  destroy(fromScene) {
    this.scene?.events?.off('update', this.updatePush, this);
    super.destroy(fromScene);
  }
}

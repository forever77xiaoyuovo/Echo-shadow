import Phaser from 'phaser';

export default class Player extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 22, 22, 0x00f0ff);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setStrokeStyle(2, 0xb6fbff, 1);
    this.body.setSize(22, 22);
    this.body.setCollideWorldBounds(true);

    this.speed = 200;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D'
    });

    scene.events.on('update', this.update, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off('update', this.update, this);
    });
  }

  update() {
    if (!this.body || !this.active) return;

    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;
    const up = this.cursors.up.isDown || this.keys.up.isDown;
    const down = this.cursors.down.isDown || this.keys.down.isDown;

    let velocityX = 0;
    let velocityY = 0;

    if (left) velocityX -= 1;
    if (right) velocityX += 1;
    if (up) velocityY -= 1;
    if (down) velocityY += 1;

    const direction = new Phaser.Math.Vector2(velocityX, velocityY);
    if (direction.lengthSq() > 0) {
      direction.normalize().scale(this.speed);
    }

    this.body.setVelocity(direction.x, direction.y);
  }
}

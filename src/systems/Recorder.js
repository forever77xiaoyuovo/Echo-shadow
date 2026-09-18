/**
 * Records the player's position once per scene update.
 * A recording can be finished and restarted without replacing the player.
 */
export default class Recorder {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.frames = [];
    this.isRecording = false;

    scene.events.on('update', this.recordFrame, this);
    this.start();
  }

  start() {
    this.frames = [];
    this.isRecording = true;

    if (this.player && this.player.active) {
      this.frames.push({ x: this.player.x, y: this.player.y });
    }
  }

  recordFrame() {
    if (!this.isRecording || !this.player || !this.player.active) return;

    this.frames.push({
      x: this.player.x,
      y: this.player.y
    });
  }

  finish() {
    this.isRecording = false;
    return this.frames.map(({ x, y }) => ({ x, y }));
  }

  destroy() {
    this.scene.events.off('update', this.recordFrame, this);
    this.frames = [];
    this.player = null;
    this.scene = null;
  }
}

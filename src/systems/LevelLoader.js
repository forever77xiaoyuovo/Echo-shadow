import PressurePlate from '../entities/PressurePlate.js';
import Door from '../entities/Door.js';
import Laser from '../entities/Laser.js';
import Box from '../entities/Box.js';

const EXIT_COLOR = 0x3dff8c;

/** Converts a JSON-compatible level definition into scene entities. */
export default class LevelLoader {
  constructor(scene) {
    this.scene = scene;
  }

  load(level) {
    const tileSize = level.grid.tileSize;
    const walls = this.createWalls(level.walls, level.grid);
    const plates = level.plates.map(({ x, y }) => new PressurePlate(this.scene, x, y, tileSize));
    const doors = level.doors.map((definition) => new Door(
      this.scene, definition.x, definition.y, definition.orientation, tileSize,
      definition.length ?? 1,
      this.resolvePlates(definition, plates)
    ));
    const lasers = level.lasers.map(({ x1, y1, x2, y2 }) => new Laser(this.scene, x1, y1, x2, y2, tileSize));
    const boxes = this.scene.physics.add.group();
    level.boxes.forEach(({ x, y }) => boxes.add(new Box(this.scene, x, y, tileSize)));

    return { level, tileSize, walls, plates, doors, lasers, boxes, exit: this.createExit(level.exit, tileSize) };
  }

  resolvePlates(door, plates) {
    if (!Array.isArray(door.plateIds)) return plates;
    return door.plateIds.map((plateId) => plates[plateId]).filter(Boolean);
  }

  createWalls(wallDefinitions, grid) {
    const walls = this.scene.physics.add.staticGroup();
    const wallShadow = this.scene.add.graphics().setDepth(1);
    const wallBody = this.scene.add.graphics().setDepth(2);
    const wallHighlight = this.scene.add.graphics().setDepth(3);

    wallDefinitions.forEach(({ x, y, w, h }) => {
      const px = x * grid.tileSize;
      const py = y * grid.tileSize;
      const width = w * grid.tileSize;
      const height = h * grid.tileSize;
      const radius = Math.min(7, grid.tileSize * 0.22);

      wallShadow.fillStyle(0x0d0d18, 1);
      wallShadow.fillRoundedRect(px, py + 2, width, height, radius);

      wallBody.fillStyle(0x1a1a2e, 1);
      wallBody.fillRoundedRect(px, py, width, height, radius);
      wallBody.lineStyle(1, 0x2a2a4a, 1);
      wallBody.strokeRoundedRect(px, py, width, height, radius);

      wallHighlight.fillStyle(0x2a2a4a, 0.9);
      wallHighlight.fillRoundedRect(px + 3, py + 1, Math.max(2, width - 6), 2, 1);

      const wall = this.scene.add.rectangle(
        (x + w / 2) * grid.tileSize, (y + h / 2) * grid.tileSize,
        width, height, 0x1a1a2e
      );
      walls.add(wall);
      wall.body.updateFromGameObject();
      // Keep the collision rectangle active while using the layered Graphics above for rendering.
      wall.setVisible(false);
    });
    return walls;
  }

  createExit(exitDefinition, tileSize) {
    const x = exitDefinition.x * tileSize + tileSize / 2;
    const y = exitDefinition.y * tileSize + tileSize / 2;
    const glow = this.scene.add.rectangle(x, y, tileSize * 1.15, tileSize * 1.15, EXIT_COLOR, 0.04).setDepth(1);
    const body = this.scene.add.rectangle(x, y, tileSize * 0.78, tileSize * 0.78, EXIT_COLOR, 0.18).setDepth(2);
    body.setStrokeStyle(2, EXIT_COLOR, 0.35);
    return { body, glow, isActive: false };
  }
}

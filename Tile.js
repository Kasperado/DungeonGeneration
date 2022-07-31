class Tile {

  id;
  posX;
  posY;
  type = TileType.NONE;
  owner; // Room or Corridor
  walls = new Array(4); // Walls // N E S W // Clockwise

  constructor(px, py) {
    this.id = `x${px}y${py}`;
    this.posX = px;
    this.posY = py;
  }

  draw() {
    if (this.type == TileType.NONE) return;
    // Set color
    if (this.type == TileType.ROOM) fill("#FFF");
    else if (this.type == TileType.CORRIDOR) fill("#DDD");
    // Draw
    strokeWeight(0);
    rect(this.x, this.y, roomSize, roomSize);
  }

  toSide(dir) {
    if (dir == 0) return gridTiles["x" + (this.posX) + "y" + (this.posY - 1)];
    if (dir == 1) return gridTiles["x" + (this.posX + 1) + "y" + (this.posY)]
    if (dir == 2) return gridTiles["x" + (this.posX) + "y" + (this.posY + 1)]
    if (dir == 3) return gridTiles["x" + (this.posX - 1) + "y" + (this.posY)]
  }

  get x() { return this.posX * roomSize }
  get y() { return this.posY * roomSize }

  isPointInTile(x, y) {
    return (this.x <= x && x <= this.x + roomSize && this.y <= y && y <= this.y + roomSize);
  }

}
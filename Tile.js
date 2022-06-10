class Tile {

  id = '';
  posX = 0;
  posY = 0;
  type; // TileType
  owner; // Room or Corridor
  gap = [false, false, false, false]; // N E S W // Clockwise
  door = [false, false, false, false]; // N E S W // Clockwise

  constructor(px, py) {
    this.id = `x${px}y${py}`;
    this.posX = px;
    this.posY = py;
  }

  draw() {
    if (this.type == TileType.ROOM) this.drawRoom();
    else if (this.type == TileType.CORRIDOR) this.drawCorridor();
  }

  drawRoom() {
    fill("#FFF");
    strokeWeight(1);
    stroke("black")
    rect(this.x, this.y, roomSize, roomSize);
    strokeWeight(0);
    fill("#DDD");
    if (this.gap[0]) this.drawEdge(0);
    if (this.gap[1]) this.drawEdge(1);
    if (this.gap[2]) this.drawEdge(2);
    if (this.gap[3]) this.drawEdge(3);
  }

  drawCorridor() {
    fill("#DDD");
    strokeWeight(1);
    stroke("black")
    rect(this.x, this.y, roomSize, roomSize);
    strokeWeight(0);
    fill("#BBB");
    if (this.gap[0]) this.drawEdge(0);
    if (this.gap[1]) this.drawEdge(1);
    if (this.gap[2]) this.drawEdge(2);
    if (this.gap[3]) this.drawEdge(3);
  }

  drawDoors() {
    strokeWeight(0);
    fill("#A22");
    if (this.door[0]) this.drawEdge(0);
    if (this.door[1]) this.drawEdge(1);
    if (this.door[2]) this.drawEdge(2);
    if (this.door[3]) this.drawEdge(3);
  }

  drawEdge(num) {
    if (num == 0) rect(this.x, this.y - 1, roomSize, 2);
    else if (num == 1) rect(this.x + roomSize - 1, this.y, 2, roomSize);
    else if (num == 2) rect(this.x, this.y + roomSize - 1, roomSize, 2);
    else if (num == 3) rect(this.x - 1, this.y, 2, roomSize);
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
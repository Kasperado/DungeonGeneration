class Wall {

  id;
  posX;
  posY;
  type = WallType.NONE; // WallType
  isHorizontal;

  constructor(px, py, isHorizontal) {
    this.posX = px;
    this.posY = py;
    this.isHorizontal = isHorizontal;
    this.id = `${this.isHorizontal ? "h" : ""}x${px}y${py}`;
  }

  draw() {
    if (this.type == WallType.NONE) return;
    // Choose color
    let color = "";
    if (this.type == WallType.SOLID) color = "#000";
    else if (this.type == WallType.GAP) color = "#CCC";
    else if (this.type == WallType.DOOR) color = "red";
    // Set color
    fill(color);
    // Draw wall
    let overdrawOffset = 1; // Slightly overdrawing will nicely close walls
    if (this.isHorizontal) rect(this.x, this.y, roomSize + overdrawOffset, 1);
    else rect(this.x, this.y, 1, roomSize + overdrawOffset);
  }

  get x() { return this.posX * roomSize }
  get y() { return this.posY * roomSize }

}
class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.id = x + "" + y;
      this.connections = [];
      this.tile = null;
      this.room = null;
    }
    
    renderSelf() {
      stroke(255)
      strokeWeight(4);
      ellipse(this.x, this.y, 10);
    }
    
    renderConnection() {
      for (let i = 0; i < this.connections.length; i++) {
        line(this.x, this.y, this.connections[i].x, this.connections[i].y);
      }
    }
    
}
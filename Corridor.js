class Corridor {

    constructor(id) {
      this.id = id;
      this.tiles = [];
    }

    addNewTile(tile) {
      this.tiles.push(tile);
      tile.owner = this;
      tile.type = TileType.CORRIDOR;
    }
    
}
class Room {

    constructor(id) {
      this.id = id;
      this.tiles = [];
      this.coreTile = null;
      this.width;
      this.height;
    }

    addNewTile(tile) {
      if (this.tiles.length == 0) this.coreTile = tile;
      this.tiles.push(tile);
      tile.owner = this;
      tile.type = TileType.ROOM;
    }
    
}
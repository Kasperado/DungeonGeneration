// Config
const canvasWidth = 800;
const canvasHeight = 800;
const pointsDesiredAmount = 100;
const pointsSpaceBetween = 100;
const pointsBorderOffset = 50;
const maxTries = 100;
const dungeonSize = 50;
const roomSize = (canvasHeight / dungeonSize);
// Room sizes
const minRoomSize = 3;
const maxRoomSize = 5;
let allowSquareRooms = false;
if (minRoomSize == maxRoomSize) allowSquareRooms = true; // Otherwise generation will never complete
// Circular path generations
const minNeighborsAway = 4;
const maxDistance = pointsSpaceBetween * 2;
// Corridor generation
const useBestStartRoomTile = true;
const useBestTargetRoomTile = true;
const useBestStartRoomCorridor = true;
const useBestTargetRoomCorridor = true;

// Data
let allPoints = [];
let allConnections = []; // All unique connections between the points
let allTiles = [];
let allWalls = [];
let allWallsSolid = [];
let allWallsGap = [];
let allWallsDoor = [];
let allRooms = [];
let allCorridors = [];
let gridTiles = {};

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  // Set seed
  let seed = floor(random(0, 10000));
  randomSeed(seed);
  // Create grid of tiles and walls
  createGrid();
  // Create random points
  allPoints = createPoints(allPoints);
  // Set connections
  calculateConnections(allPoints);
  // Create circular paths
  createCircularPaths();
  // Create rooms
  createRooms();
  // Create corridors
  createCorridors();
  allCorridors = [...new Set(allCorridors)];
  // Create gaps
  createGaps();
  // Create solid walls and assign types
  setWalls();
  // Post generation report
  console.log("Seed: " + seed);
  console.log("Connections: " + allConnections.length / 2);
  console.log("Rooms/Points: " + allRooms.length);
  console.log("Corridors: " + allCorridors.length);
  console.log("Total tiles amount: " + allTiles.length);
  console.log("Tiles used for rooms: " + allRooms.map(r => r.tiles.length).reduce((v1, v2) => v1 + v2, 0));
  console.log("Tiles used for corridors: " + allCorridors.map(c => c.tiles.length).reduce((v1, v2) => v1 + v2, 0));
}

function draw() {
  background(200);
  // Draw points
  for (let i = 0; i < allPoints.length; i++) {
    let p = allPoints[i];
    p.renderSelf();
    p.renderConnection();
    text(i, p.x, p.y);
  }
  for (let i = 0; i < allTiles.length; i++) { allTiles[i].draw(); } // Draw Tiles
  for (let i = 0; i < allWallsDoor.length; i++) { allWallsDoor[i].draw(); } // Draw doors
  for (let i = 0; i < allWallsGap.length; i++) { allWallsGap[i].draw(); } // Draw gaps  
  for (let i = 0; i < allWallsSolid.length; i++) { allWallsSolid[i].draw(); } // Draw solid walls
  // I'm setting framerate here, since if it's done in setup it looks like initial lag
  frameRate(1);
}
// Initialize grid
function createGrid() {
  // Create tiles
  for (let x = 0; x < dungeonSize; x++) {
    for (let y = 0; y < dungeonSize; y++) {
      let tile = new Tile(x, y);
      gridTiles["x" + x + "y" + y] = tile;
      allTiles.push(tile);
    }
  }
  // Create walls
  for (let x = 0; x < dungeonSize + 1; x++) {
    for (let y = 0; y < dungeonSize + 1; y++) {
      // Horizontal
      if (x < dungeonSize) {
        let wall = new Wall(x, y, true);
        allWalls.push(wall);
        // Check up and down for cells
        let upCell = gridTiles["x" + x + "y" + (y-1)];
        if (upCell) upCell.walls[2] = wall;
        let downCell = gridTiles["x" + x + "y" + y];
        if (downCell) downCell.walls[0] = wall;
      }
      // Vertical
      if (y < dungeonSize) {
        let wall = new Wall(x, y, false);
        allWalls.push(wall);
        // Check left and right for cells
        let leftCell = gridTiles["x" + (x-1) + "y" + y];
        if (leftCell) leftCell.walls[1] = wall;
        let rightCell = gridTiles["x" + x + "y" + y];
        if (rightCell) rightCell.walls[3] = wall;
      }
    }
  }
}
// Creates randomly spread points
function createPoints(allPoints = []) {
  let tries = 0;
  let createdPoints = [...allPoints];
  while (createdPoints.length < pointsDesiredAmount && tries < maxTries) {
    let rx = random(pointsBorderOffset, canvasWidth-pointsBorderOffset);
    let ry = random(pointsBorderOffset, canvasHeight-pointsBorderOffset);
    let newPoint = new Point(rx, ry);
    // Check if it's too close to other points
    let tooClose = false;
    for (let i = 0; i < createdPoints.length; i++) {
      const p = createdPoints[i];
      if (dist(newPoint.x, newPoint.y, p.x, p.y) < pointsSpaceBetween) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) {
      tries++;
      continue;
    } 
    // Add to all
    tries = 0;
    createdPoints.push(newPoint);
  }
  // Return
  return createdPoints;
}
// Minimum Spanning Tree (Prim's)
function calculateConnections(allPoints) {
  let visited = [];
  visited.push(allPoints[0]);
  let unvisited = [...allPoints];
  unvisited.splice(0, 1);
  while (unvisited.length > 0) {
    let lowestDistance = canvasWidth*2;
    let bestUnvisitedIndex = null;
    let bestVisitedIndex = null;
    // Check every unvisited vertex with every visited vertex to find best next connection pair
    for (let i = 0; i < unvisited.length; i++) {
      let unvis = unvisited[i];
      for (let y = 0; y < visited.length; y++) {
          let vis = visited[y];
          let distance = dist(unvis.x, unvis.y, vis.x, vis.y);
          if (distance < lowestDistance) {
            lowestDistance = distance;
            bestUnvisitedIndex = i;
            bestVisitedIndex = y;
          }
      }
    }
    // After finding the best connection
    unvisited[bestUnvisitedIndex].connections.push(visited[bestVisitedIndex]);
    visited[bestVisitedIndex].connections.push(unvisited[bestUnvisitedIndex]);
    allConnections.push(unvisited[bestUnvisitedIndex]);
    allConnections.push(visited[bestVisitedIndex]);
    visited.push(unvisited[bestUnvisitedIndex]);
    unvisited.splice(bestUnvisitedIndex, 1);
  }
}
// Creates additional connections between points
function createCircularPaths() {
  for (let x = 0; x < allPoints.length; x++) {
    let point = allPoints[x];
    for (let t = 0; t < allPoints.length; t++) {
      let targetPoint = allPoints[t];
      if (point.id == targetPoint.id) continue; // Skip self
      // If close enough and not connected by neighbors - try to connect
      let distance = dist(point.x, point.y, targetPoint.x, targetPoint.y);
      if (distance > maxDistance) continue; // Too far
      // Check neighbors
      let isTooClose = checkNeighbors(point, targetPoint, minNeighborsAway);
      if (isTooClose) continue;
      // All checks OK - add eachothers
      point.connections.push(targetPoint);
      targetPoint.connections.push(point);
      allConnections.push(point);
      allConnections.push(targetPoint);
      break; // No need for finding another points
    }
  }
}
// Starting from startPoint, tries to find targetPoint
function checkNeighbors(startPoint, targetPoint, maxDepth) {
  class Node {
    point = null;
    depth = 0;
  }
  let activeNodes = [];
  let proccessedIDs = [];
  let startNode = new Node();
  startNode.point = startPoint;
  activeNodes.push(startNode);
  while (activeNodes.length > 0) {
    let activeNodeIndex = floor(random(0, activeNodes.length));
    let activeNode = activeNodes[activeNodeIndex];
    for (let i = 0; i < activeNode.point.connections.length; i++) {
      const nPoint = activeNode.point.connections[i];
      if (proccessedIDs.includes(nPoint.id)) continue;
      if (nPoint.id == targetPoint.id) return true;
      if (activeNode.depth == maxDepth) continue;
      let newNode = new Node();
      newNode.point = nPoint;
      newNode.depth = activeNode.depth + 1;
      activeNodes.push(newNode);
    }
    // Done
    activeNodes.splice(activeNodeIndex, 1);
    proccessedIDs.push(activeNode.point.id);
  }
  // No way found
  return false;
}
// Creates rooms with random sizes
function createRooms() {
  let allRoomCoreTiles = [];
  // Check which points are inside which tiles and spawn core room there
  for (let t = 0; t < allTiles.length; t++) {
    let tile = allTiles[t]; 
    for (let p = 0; p < allPoints.length; p++) {
      let point = allPoints[p];
      if (tile.isPointInTile(point.x, point.y)){
        point.tile = tile;
        point.room = new Room(point.x +""+ point.y);
        point.room.addNewTile(tile);
        allRooms.push(point.room);
        tile.type = TileType.ROOM;
        allRoomCoreTiles.push(tile);
      } 
    }
  }
  // Expand core rooms into full rooms
  for (let r = 0; r < allRoomCoreTiles.length; r++) {
    let coreRoom = allRoomCoreTiles[r];
    // Set size of room
    let xSize = floor(random(minRoomSize, maxRoomSize + 1));
    let ySize = floor(random(minRoomSize, maxRoomSize + 1));
    // I dont want big squares
    while (!allowSquareRooms && xSize == ySize) {
      if (random() > 0.5) xSize = floor(random(minRoomSize, maxRoomSize + 1));
      else ySize = floor(random(minRoomSize, maxRoomSize + 1));
    }
    coreRoom.owner.width = xSize;
    coreRoom.owner.height = ySize;
    // Expand rooms
    for (let x = -floor(xSize/2); x < ceil(xSize/2); x++) {
      for (let y = -floor(ySize/2); y < ceil(ySize/2); y++) {
        if (x == 0 & y == 0) continue; // Skip middle
        let tileString = "x" + (coreRoom.posX + x) + "y" + (coreRoom.posY + y);
        let tile = gridTiles[tileString];
        if (tile?.owner == null) coreRoom.owner.addNewTile(tile);
      }
    }
  }
}
// Creates corridors between rooms
function createCorridors() {
  for (let p = 0; p < allConnections.length; p += 2) {
    let startPoint = allConnections[p];
    let startRoom = startPoint.room;
    let targetPoint = allConnections[p + 1];
    let targetRoom = targetPoint.room;
    drillCorridor(startRoom, targetRoom);
  }
}
// Creates corridor from startRoom to targetRoom by going through the grid tile by tile and utilizing any existing corridors that may help
function drillCorridor(startRoom, targetRoom) {
  let newCorridor = new Corridor(startRoom.id+targetRoom.id);
  let currentTile = startRoom.coreTile; // Tile where corridor will start
  let targetTile = targetRoom.coreTile; // Tile where corridor will end
  let previousTile;
  // Set better start location
  if (useBestStartRoomTile) currentTile = getClosestTile(startRoom.tiles, targetTile);
  // Before the drilling we should check if there is corridor tile connected to the room that is closer
  if (useBestStartRoomCorridor) {
    let candidateTiles = getCorridorTiles(startRoom);
    candidateTiles.push(currentTile);
    let closestCorridorTile = getClosestTile(candidateTiles, targetTile);
    // Check if the same is closest
    if (closestCorridorTile.id != currentTile.id) {
      newCorridor = closestCorridorTile.owner;
      currentTile = closestCorridorTile;
    }
  }
  // Set better target location
  if (useBestTargetRoomTile) targetTile = getClosestTile(targetRoom.tiles, currentTile);
  if (useBestTargetRoomCorridor) {
    let candidateTiles = getCorridorTiles(targetRoom);
    candidateTiles.push(targetTile);
    let closestCorridorTile = getClosestTile(candidateTiles, currentTile);
    targetTile = closestCorridorTile;
  }
  // Set initial direction
  let xDiff = abs(currentTile.x - targetTile.x);
  let yDiff = abs(currentTile.y - targetTile.y);
  let adjustHorizontal = (xDiff < yDiff);
  // Start the drilling
  while (true) {
    // Set direction
    if (currentTile.posY == targetTile.posY) adjustHorizontal = true;
    if (currentTile.posX == targetTile.posX) adjustHorizontal = false;
    // Move in the desired direction
        previousTile = currentTile;
    if (adjustHorizontal) currentTile = (currentTile.posX < targetTile.posX) ? currentTile.toSide(1) : currentTile.toSide(3);
    else currentTile = (currentTile.posY < targetTile.posY) ? currentTile.toSide(2) : currentTile.toSide(0);
    // If it's void - add to new corridor
    if (currentTile.type == TileType.NONE) { 
      newCorridor.addNewTile(currentTile);
    } else if (currentTile.type == TileType.CORRIDOR && currentTile.owner.id != newCorridor.id) {
      // If used tile already has an owner, then fuse it with newCorridor (usually when leaving room)
      for (let i = 0; i < newCorridor.tiles.length; i++) {
        const t = newCorridor.tiles[i];
        currentTile.owner.addNewTile(t);
      }
      newCorridor = currentTile.owner;
    }
    // Create door when needed
    let bothRoom = currentTile.type == TileType.ROOM && previousTile.type == TileType.ROOM;
    if (currentTile.owner.id != previousTile.owner.id && (currentTile.type != previousTile.type || bothRoom)) {
      for (let i = 0; i < 4; i++) {
        if (currentTile.toSide(i).id != previousTile.id) continue;
        currentTile.walls[i].type = WallType.DOOR;
        currentTile.toSide(i).walls[reverseDirection(i)].type = WallType.DOOR;
      }
    }
    // Check if hit another corridor
    let hitTile = null;
    for (let i = 0; i < 4; i++) {
      if (currentTile.toSide(i).type == TileType.CORRIDOR && currentTile.toSide(i).owner?.id != newCorridor.id) hitTile = currentTile.toSide(i);  
    }
    // Check if starting from hit corridor tile we can reach target room
    if (hitTile) {
      let loopBroken = false;
      let tilesToCheck = [hitTile];
      let doneTilesIDs = [];
      while (tilesToCheck.length > 0) {
        let randTilesIndex = floor(random(0, tilesToCheck.length));
        let tile = tilesToCheck[randTilesIndex];
        // Check for target room && Check for neighboring corridor tiles
        for (let i = 0; i < 4; i++) {
          if (tile.toSide(i).owner?.id == targetRoom.id && tile.walls[i].type == TileType.DOOR) loopBroken = true;
          if (tile.toSide(i).type == TileType.CORRIDOR && !doneTilesIDs.includes(tile.toSide(i).id) && tile.owner.id != currentTile.owner.id) tilesToCheck.push(tile.toSide(i));
        }
        // Remove checked
        doneTilesIDs.push(tile.id);
        tilesToCheck.splice(randTilesIndex, 1);
        // Found target room
        if (loopBroken) {
          // Transfer tiles to hit corridor
          for (let i = 0; i < newCorridor.tiles.length; i++) {
            const t = newCorridor.tiles[i];
            hitTile.owner.addNewTile(t);
          }
          // Stop while loop
          break;
        } 
      }
      // If recently left room, this means that it found the correct corridor instantly (or after cutting through other room first)
      if (previousTile.type == TileType.ROOM && currentTile.type == TileType.CORRIDOR) {
        // I need to check if there is door next to newly created door
        let needCleaning = false;
        // North or South
        if (currentTile.walls[0].type == TileType.DOOR || currentTile.walls[2].type == TileType.DOOR) {
          if ((currentTile.toSide(1).walls[0].type == TileType.DOOR || currentTile.toSide(1).walls[2].type == TileType.DOOR) && currentTile.toSide(1).owner?.id == currentTile.owner.id) needCleaning = true;
          if ((currentTile.toSide(3).walls[0].type == TileType.DOOR || currentTile.toSide(3).walls[2].type == TileType.DOOR) && currentTile.toSide(3).owner?.id == currentTile.owner.id) needCleaning = true;
        }
        // Left or Right
        if (currentTile.walls[1].type == TileType.DOOR || currentTile.walls[3].type == TileType.DOOR) {
          if ((currentTile.toSide(0).walls[1].type == TileType.DOOR || currentTile.toSide(0).walls[3].type == TileType.DOOR) && currentTile.toSide(0).owner?.id == currentTile.owner.id) needCleaning = true;
          if ((currentTile.toSide(2).walls[1].type == TileType.DOOR || currentTile.toSide(2).walls[3].type == TileType.DOOR) && currentTile.toSide(2).owner?.id == currentTile.owner.id) needCleaning = true;
        }
        // Return tile to void
        if (needCleaning) {
          // Reset neighbors door
          for (let i = 0; i < 4; i++) {
            if (currentTile.walls[i].type == TileType.DOOR) currentTile.toSide(i).walls[reverseDirection(i)].type = WallType.SOLID;
          }
          // Reset current tile
          currentTile.type = TileType.NONE;
          for (let i = 0; i < 4; i++) {
            currentTile.walls[i].type = TileType.SOLID;
          }
        }
      }
      // Break out of the loop
      if (loopBroken) break; 
    }
    // Reached target tile
    if (currentTile.owner.id == targetTile.owner.id) {
      allCorridors.push(newCorridor);
      break;
    }
  }
}
// Searches given array of tiles and returns tile closest to the targetTile
function getClosestTile(tiles, targetTile) {
  if (tiles.length == 0) return null;
  let closestDistance = dist(tiles[0].x, tiles[0].y, targetTile.x, targetTile.y);
  let closestTile = tiles[0];
  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles[i];
    let distance = dist(tile.x, tile.y, targetTile.x, targetTile.y);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestTile = tile;
    }
  }
  return closestTile;
}
// Searches for corridors that lead to this room 
function getCorridorTiles(room) {
  let candidateCorridors = [];
  for (let i = 0; i < room.tiles.length; i++) {
    let tile = room.tiles[i];
    // Check if there is corridor next to the tile
    for (let c = 0; c < 4; c++) {
      if (tile.walls[c].type == WallType.DOOR && tile.toSide(c).type == TileType.CORRIDOR) candidateCorridors.push(tile.toSide(c).owner); 
    }
  }
  // Extract the corridor tiles
  candidateCorridors = [...new Set(candidateCorridors)];
  candidateTiles = [];
  for (let i = 0; i < candidateCorridors.length; i++) {
    for (let x = 0; x < candidateCorridors[i].tiles.length; x++) {
      candidateTiles.push(candidateCorridors[i].tiles[x]);
    }
  }
  return candidateTiles;
}
// Check tiles and their neighbors - if they belong to same entity, remove walls
function createGaps() {
  for (let x = 0; x < dungeonSize; x++) {
    for (let y = 0; y < dungeonSize; y++) {
      let currentTile = gridTiles["x" + x + "y" + y];
      if (currentTile == null) continue;
      if (currentTile.type == TileType.NONE) continue;
      // Checks other rooms to set gap
      for (let i = 0; i < 4; i++) {
        const edgeTile = currentTile.toSide(i);
        if (edgeTile?.type != TileType.NONE) {
          let sameOwner = (edgeTile.owner.id == currentTile.owner.id);
          if (sameOwner) currentTile.walls[i].type = WallType.GAP;
        }
      }
    }
  }
}
// Sets remaining walls
function setWalls() {
  // Set walls to solid for every tile in room
  for (let room of allRooms) {
    for (let tiles of room.tiles) {
      for (let wall of tiles.walls) {
        if (wall.type == WallType.NONE) wall.type = WallType.SOLID;
      }
    }
  }
  // Set walls to solid for every tile in corridor
  for (let corr of allCorridors) {
    for (let tiles of corr.tiles) {
      for (let wall of tiles.walls) {
        if (wall.type == WallType.NONE) wall.type = WallType.SOLID;
      }
    }
  }
  // Add useful walls to seperate arrays for better manipulation
  for (let wall of allWalls) {
    switch (wall.type) {
      case WallType.SOLID:
        allWallsSolid.push(wall);
      break;
      case WallType.GAP:
        allWallsGap.push(wall);
      break;
      case WallType.DOOR:
        allWallsDoor.push(wall);
      break;
    }
  }
}
// Reverses 0-3 direction
function reverseDirection(i) {
  return (i + 2) % 4;
}
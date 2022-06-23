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
const allowSquareRooms = false;
// Circular path generations
const minNeighborsAway = 4;
const maxDistance = pointsSpaceBetween * 2;

// Data
let allPoints = [];
let allConnections = []; // All unique connections between the points
let allTiles = [];
let allRoomTiles = [];
let allRooms = [];
let gridTiles = {};

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  // Set seed
  let seed = floor(random(0, 10000));
  randomSeed(seed);
  console.log(seed);
  // Create grid of tiles
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
  // Remove walls
  removeWalls();
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
  // Draw Tiles
  for (let i = 0; i < allTiles.length; i++) {
    allTiles[i].draw();
  }
  for (let i = 0; i < allTiles.length; i++) {
    allTiles[i].drawDoors();
  }
  // I'm setting framerate here, since if it's done in setup it looks like initial lag
  frameRate(1);
}
// Initialize grid
function createGrid() {
  for (let x = 0; x < dungeonSize; x++) {
    for (let y = 0; y < dungeonSize; y++) {
      let tile = new Tile(x, y);
      gridTiles["x" + x + "y" + y] = tile;
      allTiles.push(tile);
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
  // Check which points are inside which tiles and spawn core room there
  for (let t = 0; t < allTiles.length; t++) {
    let tile = allTiles[t]; 
    for (let p = 0; p < allPoints.length; p++) {
      let point = allPoints[p];
      if (tile.isPointInTile(point.x, point.y)){
        point.tile = tile;
        point.room = new Room(point.x +""+ point.y);
        point.room.addNewTile(tile);
        tile.type = TileType.ROOM;
        allRoomTiles.push(tile);
      } 
    }
  }
  // Expand core rooms into full rooms
  for (let r = 0; r < allRoomTiles.length; r++) {
    let coreRoom = allRoomTiles[r];
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
        if (gridTiles[tileString]) {
          coreRoom.owner.addNewTile(gridTiles[tileString]);
        }
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
  // Before the drilling we should check if which room tile is the closest to the target and if there is corridor tile connected to the room that is closer
  let candidateCorridors = [];
  let closestDistance = dist(currentTile.x, currentTile.y, targetTile.x, targetTile.y);
  for (let i = 0; i < startRoom.tiles.length; i++) {
    let tile = startRoom.tiles[i];
    // Update currentTile with room tiles
    let dis = dist(tile.x, tile.y, targetTile.x, targetTile.y);
    if (dis < closestDistance) {
      closestDistance = dis;
      currentTile = tile;
    }
    // Check if there is corridor next to the tile
    if (tile.door[0]) candidateCorridors.push(tile.toSide(0).owner);
    if (tile.door[1]) candidateCorridors.push(tile.toSide(1).owner);
    if (tile.door[2]) candidateCorridors.push(tile.toSide(2).owner);
    if (tile.door[3]) candidateCorridors.push(tile.toSide(3).owner);
  }
  // Extract the corridor tiles
  candidateCorridors = [...new Set(candidateCorridors)];
  candidateTiles = [];
  for (let i = 0; i < candidateCorridors.length; i++) {
    for (let x = 0; x < candidateCorridors[i].tiles.length; x++) {
      candidateTiles.push(candidateCorridors[i].tiles[x]);
    }
  }
  // Check currentTile with corridor tiles
  for (let i = 0; i < candidateTiles.length; i++) {
    let tile = candidateTiles[i];
    let dis = dist(tile.x, tile.y, targetTile.x, targetTile.y);
    if (dis < closestDistance) {
      closestDistance = dis;
      currentTile = tile; newCorridor = tile.owner;
    }
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
    if (currentTile.type == null) { 
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
        currentTile.door[i] = true;
        currentTile.toSide(i).door[(i + 2) % 4] = true;
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
          if (tile.toSide(i).owner?.id == targetRoom.id && tile.door[i]) loopBroken = true;  
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
        if (currentTile.door[0] || currentTile.door[2]) {
          if ((currentTile.toSide(1).door[0] || currentTile.toSide(1).door[2]) && currentTile.toSide(1).owner?.id == currentTile.owner.id) needCleaning = true;
          if ((currentTile.toSide(3).door[0] || currentTile.toSide(3).door[2]) && currentTile.toSide(3).owner?.id == currentTile.owner.id) needCleaning = true;
        }
        // Left or Right
        if (currentTile.door[1] || currentTile.door[3]) {
          if ((currentTile.toSide(0).door[1] || currentTile.toSide(0).door[3]) && currentTile.toSide(0).owner?.id == currentTile.owner.id) needCleaning = true;
          if ((currentTile.toSide(2).door[1] || currentTile.toSide(2).door[3]) && currentTile.toSide(2).owner?.id == currentTile.owner.id) needCleaning = true;
        }
        // Return tile to void
        if (needCleaning) {
          // Reset neighbors door
          if (currentTile.door[0]) currentTile.toSide(0).door[2] = false;
          if (currentTile.door[1]) currentTile.toSide(1).door[3] = false;
          if (currentTile.door[2]) currentTile.toSide(2).door[0] = false;
          if (currentTile.door[3]) currentTile.toSide(3).door[1] = false;
          // Reset current tile
          currentTile.type = null;
          currentTile.door = [false, false, false, false];
        }
      }
      // Break out of the loop
      if (loopBroken) break; 
    }
    // Reached target room
    if (currentTile.type == TileType.ROOM && currentTile.owner.id == targetRoom.id) break;
  }
}
// Check tiles and their neighbors - if they belong to same entity, remove walls
function removeWalls() {
  for (let x = 0; x < dungeonSize; x++) {
    for (let y = 0; y < dungeonSize; y++) {
      let currentTile = gridTiles["x" + x + "y" + y];
      if (currentTile == null) continue;
      if (currentTile.type == null) continue;
      // Checks other rooms to set gap
      for (let i = 0; i < 4; i++) {
        const edgeTile = currentTile.toSide(i);
        if (edgeTile?.type != null) {
          let sameOwner = (edgeTile.owner.id == currentTile.owner.id);
          if (sameOwner) currentTile.gap[i] = true;
        }
      }
    }
  }
}














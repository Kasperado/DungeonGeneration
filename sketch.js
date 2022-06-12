// Config
const canvasWidth = 800;
const canvasHeight = 800;
const pointsDesiredAmount = 100;
const pointsSpaceBetween = 100;
const pointsBorderOffset = 50;
const maxTries = 100;
const dungeonSize = 50;
const roomSize = (canvasHeight / dungeonSize);
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
  // Seeds to test: 8525 - doors next to each other, 1326 - corridor next to another, 3364 - both
  let seed = floor(random(0, 10000));
  randomSeed(seed);
  console.log(seed);
  // Create random points
  allPoints = createPoints(allPoints);
  // Set connections
  calculateConnections(allPoints);
  // Create circular paths
  createCircularPaths();
  // Create core tiles
  for (let x = 0; x < dungeonSize; x++) {
    for (let y = 0; y < dungeonSize; y++) {
      let tile = new Tile(x, y);
      gridTiles["x" + x + "y" + y] = tile;
      allTiles.push(tile);
    }
  }
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
  let neighborSearchDepth = 4;
  let maxDistance = pointsSpaceBetween * 2;
  for (let x = 0; x < allPoints.length; x++) {
    let point = allPoints[x];
    for (let t = 0; t < allPoints.length; t++) {
      let targetPoint = allPoints[t];
      if (point.id == targetPoint.id) continue; // Skip self
      // If close enough and not connected by neighbors - try to connect
      let distance = dist(point.x, point.y, targetPoint.x, targetPoint.y);
      if (distance > maxDistance) continue; // Too far
      // Check neighbors
      let isTooClose = checkNeighbors(point, targetPoint, neighborSearchDepth);
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
    let minRoomSize = 3;
    let maxRoomSize = 6;
    let xSize = floor(random(minRoomSize, maxRoomSize));
    let ySize = floor(random(minRoomSize, maxRoomSize));
    // I dont want big squares
    while (xSize == ySize) {
      if (random() > 0.5) xSize = floor(random(minRoomSize, maxRoomSize));
      else ySize = floor(random(minRoomSize, maxRoomSize));
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

function drillCorridor(startRoom, targetRoom) {
  let newCorridor = new Corridor(startRoom.id+targetRoom.id);
    // Check sizes of the rooms and decide if corridor can be straight or if it needs a curve
    let currentTile = startRoom.coreTile;
    let previousTile;
  let xDiff = abs(startRoom.x - targetRoom.x);
  let yDiff = abs(startRoom.y - targetRoom.y);
    let adjustHorizontal = (xDiff < yDiff);
    while (true) {
      if (currentTile.posY == targetRoom.coreTile.posY) adjustHorizontal = true;
      if (currentTile.posX == targetRoom.coreTile.posX) adjustHorizontal = false;
      if (adjustHorizontal) {
        // Move x
        if (currentTile.posX < targetRoom.coreTile.posX) {
          previousTile = currentTile;
          currentTile = currentTile.toSide(1);
        } else if (currentTile.posX > targetRoom.coreTile.posX) {
          previousTile = currentTile;
          currentTile = currentTile.toSide(3);
        }
      } else {
        // Move y
        if (currentTile.posY < targetRoom.coreTile.posY) {
          previousTile = currentTile;
          currentTile = currentTile.toSide(2);
        } else if (currentTile.posY > targetRoom.coreTile.posY) {
          previousTile = currentTile;
          currentTile = currentTile.toSide(0);
        }
      }
      // If it's void - add to new corridor
      if (currentTile.type == null) newCorridor.addNewTile(currentTile);
      // Create door when needed
      let bothRoom = currentTile.type == TileType.ROOM && previousTile.type == TileType.ROOM;
      if (currentTile.owner.id != previousTile.owner.id && (currentTile.type != previousTile.type || bothRoom)) {
      if (currentTile.toSide(0).id == previousTile.id) {
        currentTile.door[0] = true;
        currentTile.toSide(0).door[2] = true;
      } else if (currentTile.toSide(1).id == previousTile.id) {
        currentTile.door[1] = true;
        currentTile.toSide(1).door[3] = true;
      } else if (currentTile.toSide(2).id == previousTile.id) {
        currentTile.door[2] = true;
        currentTile.toSide(2).door[0] = true;
      } else if (currentTile.toSide(3).id == previousTile.id) {
        currentTile.door[3] = true;
        currentTile.toSide(3).door[1] = true;
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
        // Check for target room
        if (tile.toSide(0).owner?.id == targetRoom.id && tile.toSide(0).door[2]) loopBroken = true;
        if (tile.toSide(1).owner?.id == targetRoom.id && tile.toSide(1).door[3]) loopBroken = true;
        if (tile.toSide(2).owner?.id == targetRoom.id && tile.toSide(2).door[0]) loopBroken = true;
        if (tile.toSide(3).owner?.id == targetRoom.id && tile.toSide(3).door[1]) loopBroken = true;
        // Check for neighboring corridor tiles
        if (tile.toSide(0).type == TileType.CORRIDOR && !doneTilesIDs.includes(tile.toSide(0).id)) tilesToCheck.push(tile.toSide(0));
        if (tile.toSide(1).type == TileType.CORRIDOR && !doneTilesIDs.includes(tile.toSide(1).id)) tilesToCheck.push(tile.toSide(1));
        if (tile.toSide(2).type == TileType.CORRIDOR && !doneTilesIDs.includes(tile.toSide(2).id)) tilesToCheck.push(tile.toSide(2));
        if (tile.toSide(3).type == TileType.CORRIDOR && !doneTilesIDs.includes(tile.toSide(3).id)) tilesToCheck.push(tile.toSide(3));
        // Remove checked
        doneTilesIDs.push(tile.id);
        tilesToCheck.splice(randTilesIndex, 1);
        // Found target room
        if (loopBroken) break;
      }
      if (loopBroken) break; // Break out of the loop
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
      let nTile = currentTile.toSide(0);
      let eTile = currentTile.toSide(1);
      let sTile = currentTile.toSide(2);
      let wTile = currentTile.toSide(3);
      let arr = [nTile, eTile, sTile, wTile];
      for (let i = 0; i < arr.length; i++) {
        const edgeTile = arr[i];
        if (edgeTile?.type != null) {
          if (edgeTile.owner.id == currentTile.owner.id || (currentTile.type == TileType.CORRIDOR && edgeTile.type == TileType.CORRIDOR)) currentTile.gap[i] = true;
        }
      }
    }
  }
}














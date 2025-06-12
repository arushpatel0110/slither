    const express = require('express');
    const http = require('http');
    const { Server } = require('socket.io');

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
    cors: {
        origin:'*',
        methods: ['GET', 'POST']
    }
    });
    let players = {};

    app.use(express.static('public'));
    const CELL_SIZE = 100;   
    const MAP_BOUND = 10000;
    let foodDots = [];
    let grid = new Map();  
function updateAndBroadcastLeaderboard() {

    const playersArray = Object.values(players);

    playersArray.sort((a, b) => b.score - a.score);
    const topPlayers = playersArray.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        score: p.score,
        face: p.face
    }));
    io.emit('leaderboardUpdate', topPlayers);
}

    function getRandomColor() {
        return Math.floor(Math.random() * 0xffffff);
    }

    function getCellKey(x, y) {
        const cellX = Math.floor(x / CELL_SIZE);
        const cellY = Math.floor(y / CELL_SIZE);
        return `${cellX},${cellY}`;
    }

    function addDotToGrid(dot) {
        const key = getCellKey(dot.x, dot.y);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(dot);
    }

    function generateFoodDots(count = 10000) {
        foodDots = [];
        grid.clear();
        for (let i = 0; i < count; i++) {
            const x = (Math.floor(Math.random() * (2 * MAP_BOUND)) - MAP_BOUND);
            const y = (Math.floor(Math.random() * (2 * MAP_BOUND)) - MAP_BOUND);
            const color = getRandomColor();
            const dot = { id: `${Date.now()}-${i}`, x, y, color };
            foodDots.push(dot);
            addDotToGrid(dot);
        }
    }
    function getNearbyDots(playerX, playerY, radius = 3000) {
        const minCellX = Math.floor((playerX - radius) / CELL_SIZE);
        const maxCellX = Math.floor((playerX + radius) / CELL_SIZE);
        const minCellY = Math.floor((playerY - radius) / CELL_SIZE);
        const maxCellY = Math.floor((playerY + radius) / CELL_SIZE);

        let nearbyDots = [];

        for (let cx = minCellX; cx <= maxCellX; cx++) {
            for (let cy = minCellY; cy <= maxCellY; cy++) {
                const key = `${cx},${cy}`;
                if (grid.has(key)) {
                    nearbyDots = nearbyDots.concat(grid.get(key));
                }
            }
        }


        const rSq = radius * radius;
        return nearbyDots.filter(dot => {
            const dx = dot.x - playerX;
            const dy = dot.y - playerY;
            return dx * dx + dy * dy <= rSq;
        });
    }


    generateFoodDots();

    io.on('connection', (socket) => {
        const selectedFace = socket.handshake.query.face || 'face1';
        const name = socket.handshake.query.name || 'Player';

        console.log(`Player connected: ${socket.id}`);


        players[socket.id] = {
            id: socket.id,
            x: 500,
            y: 500,
            angle: 0, 
            name:name,
            face: selectedFace,
            body: [],
            died:false,
             score: 0, 
        
        };
        socket.emit('currentPlayers', players);

    const visibleDots = getNearbyDots(players[socket.id].x, players[socket.id].y);
    socket.emit('initialDots', visibleDots);
updateAndBroadcastLeaderboard();
    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        x: players[socket.id].x,
        y: players[socket.id].y,
        angle: players[socket.id].angle,
        body: players[socket.id].body,
        name: players[socket.id].name,
        face: players[socket.id].face,
    });
    socket.on('dotEaten', (dotId) => {
        const index = foodDots.findIndex(dot => dot.id === dotId);
        if (index !== -1) {
            const [eatenDot] = foodDots.splice(index, 1);

        const key = getCellKey(eatenDot.x, eatenDot.y);
            if (grid.has(key)) {
                const cellDots = grid.get(key);
                const dotIndex = cellDots.findIndex(dot => dot.id === dotId);
                if (dotIndex !== -1) {
                    cellDots.splice(dotIndex, 1);
                    if (cellDots.length === 0) grid.delete(key);
                }
            }
           if (players[socket.id]) {
    players[socket.id].score += 1;
    io.emit('updateScore', { playerId: socket.id, score: players[socket.id].score });
    updateAndBroadcastLeaderboard();
}

            io.emit('dotRemoved', eatenDot.id);

  if (!eatenDot.fromDeath) {
            const x = Math.floor(Math.random() * 2000) - 1000;
            const y = Math.floor(Math.random() * 2000) - 1000;
            const color = getRandomColor();
            const newDot = { id: `${Date.now()}-${Math.random()}`, x, y, color };
            foodDots.push(newDot);
            addDotToGrid(newDot);
            io.emit('dotSpawned', newDot);
  } 
        }
    });
    
    
        socket.on('playerMovement', (data) => {
            if (players[socket.id]) {
                players[socket.id].x = data.x;
                players[socket.id].y = data.y;
                players[socket.id].angle = data.angle;
                players[socket.id].body = data.body;
            players[socket.id].face = data.face && typeof data.face === 'string' ? data.face : players[socket.id].face || 'face1';

        const dx = data.x;
        const dy = data.y;
        const distSq = dx * dx + dy * dy;

    socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: data.x,
        y: data.y,
        angle: data.angle,
        face: data.face,
        color: players[socket.id].color,
        body: data.body
    });

        }
        });
    socket.on('playerDied', (bodySegments) => {
     if (!players[socket.id]) return;   
players[socket.id].died = true;
      const bodyData = bodySegments.map(seg => ({
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    x: seg.x,
    y: seg.y,
    color: seg.color || getRandomColor(),
    fromDeath: true  
}));

        foodDots.push(...bodyData);
       bodyData.forEach(addDotToGrid);
        io.emit('playerDiedBroadcast', {
            playerId: socket.id,
            bodyData
        });

        setTimeout(() => {
            delete players[socket.id];
            console.log(`Cleaned up player ${socket.id} after death.`);
        }, 100);
    });
socket.on('scoreUpdate', ({ playerId, score }) => {
    if (players[playerId]) {
        players[playerId].score = score;
        updateAndBroadcastLeaderboard(); 
    }
});
    socket.on('disconnect', () => {
    const died = players[socket.id]?.died;
    if (!died) {
        io.emit('playerDisconnected', socket.id);
    }
    delete players[socket.id];
    console.log(`Player ${socket.id} disconnected${died ? ' after death' : ''}.`);
    });
    });

const PORT = process.env.PORT || 8080;  
server.listen(PORT, () => {
    console.log(`Server listening on https://slither-fux5.onrender.com or http://localhost:${PORT}`);
});



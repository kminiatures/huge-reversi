const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

const GameManager = require('./gameManager');
const gameManager = new GameManager();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinGame', (data) => {
    const { gameId, playerName } = data;
    gameManager.addPlayer(gameId, socket.id, playerName);
    socket.join(gameId);
    
    const game = gameManager.getGame(gameId);
    if (game) {
      io.to(gameId).emit('gameState', game.getState());
    }
  });

  socket.on('makeMove', (data) => {
    const { gameId, row, col } = data;
    const result = gameManager.makeMove(gameId, socket.id, row, col);
    
    if (result.success) {
      const game = gameManager.getGame(gameId);
      io.to(gameId).emit('gameState', game.getState());
      
      if (result.gameOver) {
        io.to(gameId).emit('gameOver', result.winner);
      }
    } else {
      socket.emit('error', result.error);
    }
  });

  socket.on('chatMessage', (data) => {
    const { gameId, message } = data;
    const game = gameManager.getGame(gameId);
    
    if (game) {
      const player = game.players.find(p => p.socketId === socket.id);
      if (player) {
        const chatData = {
          playerName: player.playerName,
          message: message,
          timestamp: new Date().toISOString()
        };
        
        io.to(gameId).emit('chatMessage', chatData);
      }
    }
  });

  socket.on('mouseMove', (data) => {
    const { gameId, x, y, boardX, boardY } = data;
    const game = gameManager.getGame(gameId);
    
    if (game) {
      const player = game.players.find(p => p.socketId === socket.id);
      if (player) {
        // 自分以外のプレイヤーにマウス位置を送信
        socket.to(gameId).emit('opponentMouseMove', {
          playerName: player.playerName,
          playerNumber: player.playerNumber,
          x: x,
          y: y,
          boardX: boardX,
          boardY: boardY
        });
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    gameManager.removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
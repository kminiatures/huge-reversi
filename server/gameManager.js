const ReversiGame = require('./reversiGame');

class GameManager {
  constructor() {
    this.games = new Map();
    this.playerGameMap = new Map();
  }

  addPlayer(gameId, socketId, playerName) {
    if (!this.games.has(gameId)) {
      this.games.set(gameId, new ReversiGame(gameId));
    }

    const game = this.games.get(gameId);
    game.addPlayer(socketId, playerName);
    this.playerGameMap.set(socketId, gameId);
  }

  removePlayer(socketId) {
    const gameId = this.playerGameMap.get(socketId);
    if (gameId && this.games.has(gameId)) {
      const game = this.games.get(gameId);
      game.removePlayer(socketId);
      
      if (game.isEmpty()) {
        this.games.delete(gameId);
      }
    }
    this.playerGameMap.delete(socketId);
  }

  makeMove(gameId, socketId, row, col) {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    return game.makeMove(socketId, row, col);
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }
}

module.exports = GameManager;
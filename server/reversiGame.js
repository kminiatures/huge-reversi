class ReversiGame {
  constructor(gameId, boardSize = 32) {
    this.gameId = gameId;
    this.boardSize = boardSize;
    this.board = this.initializeBoard();
    this.players = [];
    this.currentPlayer = 0;
    this.gameStarted = false;
    this.directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
  }

  initializeBoard() {
    const board = Array(this.boardSize).fill(null).map(() => 
      Array(this.boardSize).fill(0)
    );
    
    const center = Math.floor(this.boardSize / 2);
    board[center - 1][center - 1] = 2;
    board[center - 1][center] = 1;
    board[center][center - 1] = 1;
    board[center][center] = 2;
    
    return board;
  }

  addPlayer(socketId, playerName) {
    if (this.players.length < 2) {
      const playerNumber = this.players.length + 1;
      this.players.push({
        socketId,
        playerName,
        playerNumber
      });

      if (this.players.length === 2) {
        this.gameStarted = true;
      }
    }
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
    if (this.players.length === 0) {
      this.gameStarted = false;
    }
  }

  isEmpty() {
    return this.players.length === 0;
  }

  makeMove(socketId, row, col) {
    if (!this.gameStarted || this.players.length !== 2) {
      return { success: false, error: 'Game not ready' };
    }

    const currentPlayerData = this.players[this.currentPlayer];
    if (currentPlayerData.socketId !== socketId) {
      return { success: false, error: 'Not your turn' };
    }

    if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
      return { success: false, error: 'Invalid position' };
    }

    if (this.board[row][col] !== 0) {
      return { success: false, error: 'Position already occupied' };
    }

    const playerNumber = currentPlayerData.playerNumber;
    const flippedPieces = this.getFlippedPieces(row, col, playerNumber);

    if (flippedPieces.length === 0) {
      return { success: false, error: 'Invalid move' };
    }

    this.board[row][col] = playerNumber;
    flippedPieces.forEach(([r, c]) => {
      this.board[r][c] = playerNumber;
    });

    this.currentPlayer = (this.currentPlayer + 1) % 2;

    if (!this.hasValidMoves(this.players[this.currentPlayer].playerNumber)) {
      this.currentPlayer = (this.currentPlayer + 1) % 2;
      
      if (!this.hasValidMoves(this.players[this.currentPlayer].playerNumber)) {
        const winner = this.getWinner();
        return { success: true, gameOver: true, winner };
      }
    }

    return { success: true, gameOver: false };
  }

  getFlippedPieces(row, col, playerNumber) {
    const flipped = [];
    const opponent = playerNumber === 1 ? 2 : 1;

    for (const [dr, dc] of this.directions) {
      const tempFlipped = [];
      let r = row + dr;
      let c = col + dc;

      while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
        if (this.board[r][c] === 0) break;
        if (this.board[r][c] === opponent) {
          tempFlipped.push([r, c]);
        } else if (this.board[r][c] === playerNumber) {
          flipped.push(...tempFlipped);
          break;
        }
        r += dr;
        c += dc;
      }
    }

    return flipped;
  }

  hasValidMoves(playerNumber) {
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (this.board[row][col] === 0) {
          if (this.getFlippedPieces(row, col, playerNumber).length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getWinner() {
    const counts = { 1: 0, 2: 0 };
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (this.board[row][col] !== 0) {
          counts[this.board[row][col]]++;
        }
      }
    }

    if (counts[1] > counts[2]) return this.players[0];
    if (counts[2] > counts[1]) return this.players[1];
    return null;
  }

  getState() {
    const counts = { 1: 0, 2: 0 };
    for (let row = 0; row < this.boardSize; row++) {
      for (let col = 0; col < this.boardSize; col++) {
        if (this.board[row][col] !== 0) {
          counts[this.board[row][col]]++;
        }
      }
    }

    return {
      gameId: this.gameId,
      board: this.board,
      players: this.players,
      currentPlayer: this.currentPlayer,
      gameStarted: this.gameStarted,
      boardSize: this.boardSize,
      scores: counts
    };
  }
}

module.exports = ReversiGame;
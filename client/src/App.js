import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styled from 'styled-components';
import GameBoard from './components/GameBoard';
import VirtualizedBoard from './components/VirtualizedBoard';
import GameControls from './components/GameControls';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: #1a1a1a;
  color: white;
  font-family: Arial, sans-serif;
`;

const Header = styled.h1`
  margin: 20px 0;
  color: #4CAF50;
`;

const GameContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  max-width: 100vw;
  overflow: hidden;
`;

const GameInfo = styled.div`
  background-color: #2a2a2a;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border: 2px solid #4CAF50;
`;

const InfoItem = styled.div`
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: bold;
  color: #4CAF50;
  margin-right: 10px;
`;

const InfoValue = styled.span`
  color: white;
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    newSocket.on('gameOver', (winner) => {
      alert(`ゲーム終了！勝者: ${winner ? winner.playerName : '引き分け'}`);
    });

    newSocket.on('error', (error) => {
      alert(`エラー: ${error}`);
    });

    return () => newSocket.close();
  }, []);

  const joinGame = () => {
    if (socket && gameId && playerName) {
      socket.emit('joinGame', { gameId, playerName });
    }
  };

  const makeMove = (row, col) => {
    if (socket && gameState) {
      socket.emit('makeMove', { gameId: gameState.gameId, row, col });
    }
  };

  // 有効な手を計算する関数
  const calculateValidMoves = (gameState) => {
    console.log('calculateValidMoves called with gameState:', gameState);
    
    if (!gameState) {
      console.log('No gameState');
      return new Set();
    }
    
    if (!gameState.gameStarted) {
      console.log('Game not started');
      return new Set();
    }
    
    if (gameState.players.length !== 2) {
      console.log('Not enough players:', gameState.players.length);
      return new Set();
    }

    const currentPlayerNumber = gameState.players[gameState.currentPlayer].playerNumber;
    console.log('Current player number:', currentPlayerNumber);
    console.log('Board center area:', gameState.board.slice(14, 18).map(row => row.slice(14, 18)));
    
    const validMoves = new Set();
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    const getFlippedPieces = (row, col, playerNumber) => {
      const flipped = [];
      const opponent = playerNumber === 1 ? 2 : 1;

      for (const [dr, dc] of directions) {
        const tempFlipped = [];
        let r = row + dr;
        let c = col + dc;

        while (r >= 0 && r < gameState.boardSize && c >= 0 && c < gameState.boardSize) {
          if (gameState.board[r][c] === 0) break;
          if (gameState.board[r][c] === opponent) {
            tempFlipped.push([r, c]);
          } else if (gameState.board[r][c] === playerNumber) {
            flipped.push(...tempFlipped);
            break;
          }
          r += dr;
          c += dc;
        }
      }

      return flipped;
    };

    // 全ての空きセルを検査（デバッグ用に一部のみ）
    for (let row = 0; row < gameState.boardSize; row++) {
      for (let col = 0; col < gameState.boardSize; col++) {
        if (gameState.board[row][col] === 0) {
          const flipped = getFlippedPieces(row, col, currentPlayerNumber);
          if (flipped.length > 0) {
            validMoves.add(`${row}-${col}`);
            console.log(`Valid move found at [${row}, ${col}]: ${flipped.length} pieces would be flipped`);
          }
        }
      }
    }

    console.log('Valid moves found:', validMoves);
    return validMoves;
  };

  return (
    <AppContainer>
      <Header>巨大オセロ - Huge Reversi</Header>
      
      {!gameState ? (
        <GameControls
          gameId={gameId}
          setGameId={setGameId}
          playerName={playerName}
          setPlayerName={setPlayerName}
          onJoinGame={joinGame}
          connected={connected}
        />
      ) : (
        <>
          <GameInfo>
            <InfoItem>
              <InfoLabel>ゲームID:</InfoLabel>
              <InfoValue>{gameState?.gameId || gameId}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>あなたのプレイヤー名:</InfoLabel>
              <InfoValue>{playerName}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>参加プレイヤー:</InfoLabel>
              <InfoValue>
                {gameState?.players?.map(p => p.playerName).join(', ') || 'なし'} 
                ({gameState?.players?.length || 0}/2)
              </InfoValue>
            </InfoItem>
            {gameState?.gameStarted && (
              <InfoItem>
                <InfoLabel>現在のターン:</InfoLabel>
                <InfoValue>{gameState.players[gameState.currentPlayer]?.playerName}</InfoValue>
              </InfoItem>
            )}
          </GameInfo>
          
          <GameContainer>
            {gameState && gameState.boardSize > 16 ? (
              <VirtualizedBoard 
                gameState={gameState} 
                onMakeMove={makeMove}
                validMoves={calculateValidMoves(gameState)}
              />
            ) : (
              <GameBoard 
                gameState={gameState} 
                onMakeMove={makeMove}
              />
            )}
          </GameContainer>
        </>
      )}
    </AppContainer>
  );
}

export default App;
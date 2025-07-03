import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const GameContainer = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  max-width: 100vw;
`;

const BoardContainer = styled.div`
  position: relative;
  overflow: auto;
  max-width: 80vw;
  max-height: 80vh;
  border: 3px solid #4CAF50;
  border-radius: 10px;
  background-color: #2a2a2a;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.$size}, 30px);
  grid-template-rows: repeat(${props => props.$size}, 30px);
  gap: 1px;
  background-color: #444;
  padding: 10px;
`;

const Cell = styled.div`
  width: 30px;
  height: 30px;
  background-color: #2e7d32;
  border: 1px solid #1b5e20;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &:hover {
    background-color: ${props => props.$clickable ? '#388e3c' : '#2e7d32'};
  }
`;

const Piece = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.$player === 1 ? '#000000' : '#ffffff'};
  border: 2px solid ${props => props.$player === 1 ? '#333333' : '#cccccc'};
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  transform-style: preserve-3d;
  
  &.flipping {
    animation: flip 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  }
  
  &.placing {
    animation: place 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  @keyframes flip {
    0% {
      transform: rotateY(0deg);
    }
    50% {
      transform: rotateY(90deg) scaleX(0.8);
    }
    100% {
      transform: rotateY(180deg);
    }
  }
  
  @keyframes place {
    0% {
      transform: scale(0) rotateZ(180deg);
      opacity: 0;
    }
    70% {
      transform: scale(1.2) rotateZ(20deg);
    }
    100% {
      transform: scale(1) rotateZ(0deg);
      opacity: 1;
    }
  }
`;

const GameInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background-color: #2a2a2a;
  border-radius: 10px;
  min-width: 250px;
`;

const PlayerInfo = styled.div`
  padding: 15px;
  border-radius: 8px;
  background-color: ${props => props.$active ? '#4CAF50' : '#333'};
  border: 2px solid ${props => props.$active ? '#66BB6A' : '#555'};
`;

const PlayerName = styled.div`
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
`;

const PlayerScore = styled.div`
  font-size: 14px;
  color: #ccc;
`;

const GameStatus = styled.div`
  padding: 15px;
  background-color: #333;
  border-radius: 8px;
  text-align: center;
`;

function GameBoard({ gameState, onMakeMove, validMoves = new Set() }) {
  const boardRef = useRef(null);
  const [flippingPieces, setFlippingPieces] = useState(new Set());
  const [placingPieces, setPlacingPieces] = useState(new Set());
  const prevBoardRef = useRef(null);

  // ボードの変更を検出してアニメーションを実行
  useEffect(() => {
    if (!gameState || !gameState.board || !prevBoardRef.current) {
      prevBoardRef.current = gameState?.board;
      return;
    }

    const prevBoard = prevBoardRef.current;
    const currentBoard = gameState.board;
    const newFlippingPieces = new Set();
    const newPlacingPieces = new Set();

    // 変更されたセルを検出
    for (let row = 0; row < gameState.boardSize; row++) {
      for (let col = 0; col < gameState.boardSize; col++) {
        if (prevBoard[row] && currentBoard[row]) {
          if (prevBoard[row][col] === 0 && currentBoard[row][col] !== 0) {
            // 新しく置かれたコマ
            newPlacingPieces.add(`${row}-${col}`);
          } else if (prevBoard[row][col] !== 0 && currentBoard[row][col] !== 0 &&
                     prevBoard[row][col] !== currentBoard[row][col]) {
            // コマが変更された（ひっくり返った）
            newFlippingPieces.add(`${row}-${col}`);
          }
        }
      }
    }

    if (newPlacingPieces.size > 0) {
      setPlacingPieces(newPlacingPieces);
      
      // アニメーション終了後にクラスを削除
      setTimeout(() => {
        setPlacingPieces(new Set());
      }, 400); // 配置アニメーション時間
    }

    if (newFlippingPieces.size > 0) {
      setFlippingPieces(newFlippingPieces);
      
      // アニメーション終了後にクラスを削除
      setTimeout(() => {
        setFlippingPieces(new Set());
      }, 600); // ひっくり返しアニメーション時間
    }

    prevBoardRef.current = currentBoard.map(row => [...row]); // ディープコピー
  }, [gameState?.board]);

  const handleCellClick = (row, col) => {
    if (validMoves.has(`${row}-${col}`)) {
      onMakeMove(row, col);
    }
  };

  if (!gameState) return null;

  return (
    <GameContainer>
      <BoardContainer ref={boardRef}>
        <Board $size={gameState.boardSize}>
          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isFlipping = flippingPieces.has(`${rowIndex}-${colIndex}`);
              const isPlacing = placingPieces.has(`${rowIndex}-${colIndex}`);
              
              const getAnimationClass = () => {
                if (isFlipping) return 'flipping';
                if (isPlacing) return 'placing';
                return '';
              };
              
              return (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  $clickable={validMoves.has(`${rowIndex}-${colIndex}`)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                >
                  {cell !== 0 && (
                    <Piece 
                      $player={cell} 
                      className={getAnimationClass()}
                    />
                  )}
                  {validMoves.has(`${rowIndex}-${colIndex}`) && (
                    <div style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#FFD700',
                      opacity: 0.7
                    }} />
                  )}
                </Cell>
              );
            })
          )}
        </Board>
      </BoardContainer>

      <GameInfo>
        {gameState.players.map((player, index) => (
          <PlayerInfo key={player.socketId} $active={gameState.currentPlayer === index}>
            <PlayerName>
              {player.playerName} (Player {player.playerNumber})
            </PlayerName>
            <PlayerScore>
              スコア: {gameState.scores[player.playerNumber] || 0}
            </PlayerScore>
          </PlayerInfo>
        ))}

        <GameStatus>
          {gameState.gameStarted ? (
            <div>
              <div>現在のプレイヤー:</div>
              <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {gameState.players[gameState.currentPlayer]?.playerName}
              </div>
            </div>
          ) : (
            <div>プレイヤーを待機中... ({gameState.players.length}/2)</div>
          )}
        </GameStatus>
      </GameInfo>
    </GameContainer>
  );
}

export default GameBoard;
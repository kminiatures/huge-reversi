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
  transition: all 0.3s ease;
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
            row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                $clickable={validMoves.has(`${rowIndex}-${colIndex}`)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell !== 0 && <Piece $player={cell} />}
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
            ))
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
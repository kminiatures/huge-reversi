import React, { useState, useRef, useEffect, useMemo } from 'react';
import styled from 'styled-components';

const VirtualContainer = styled.div`
  position: relative;
  width: 600px;
  height: 600px;
  overflow: auto;
  border: 3px solid #4CAF50;
  border-radius: 10px;
  background-color: #2a2a2a;
`;

const VirtualBoard = styled.div`
  position: relative;
  width: ${props => props.$totalWidth}px;
  height: ${props => props.$totalHeight}px;
`;

const VirtualRow = styled.div`
  position: absolute;
  left: 0;
  top: ${props => props.$top}px;
  width: 100%;
  height: ${props => props.$height}px;
  display: flex;
`;

const Cell = styled.div`
  width: 20px;
  height: 20px;
  background-color: #2e7d32;
  border: 1px solid #1b5e20;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: ${props => props.$left}px;
  
  &:hover {
    background-color: ${props => props.$clickable ? '#388e3c' : '#2e7d32'};
  }
`;

const Piece = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.$player === 1 ? '#000000' : '#ffffff'};
  border: 1px solid ${props => props.$player === 1 ? '#333333' : '#cccccc'};
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

const CELL_SIZE = 20;
const BUFFER_SIZE = 5;

function VirtualizedBoard({ gameState, onMakeMove, validMoves }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(600);
  const [flippingPieces, setFlippingPieces] = useState(new Set());
  const [placingPieces, setPlacingPieces] = useState(new Set());
  const prevBoardRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      setScrollLeft(container.scrollLeft);
    };

    const handleResize = () => {
      setContainerHeight(container.clientHeight);
      setContainerWidth(container.clientWidth);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    handleResize();

    // 初期位置を中央に設定
    if (gameState) {
      const centerPosition = (gameState.boardSize * CELL_SIZE / 2) - (600 / 2);
      container.scrollTop = Math.max(0, centerPosition);
      container.scrollLeft = Math.max(0, centerPosition);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [gameState]);

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

  const visibleRange = useMemo(() => {
    if (!gameState) return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };

    const startRow = Math.max(0, Math.floor(scrollTop / CELL_SIZE) - BUFFER_SIZE);
    const endRow = Math.min(
      gameState.boardSize - 1,
      Math.ceil((scrollTop + containerHeight) / CELL_SIZE) + BUFFER_SIZE
    );
    const startCol = Math.max(0, Math.floor(scrollLeft / CELL_SIZE) - BUFFER_SIZE);
    const endCol = Math.min(
      gameState.boardSize - 1,
      Math.ceil((scrollLeft + containerWidth) / CELL_SIZE) + BUFFER_SIZE
    );

    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, containerHeight, containerWidth, gameState]);

  const handleCellClick = (row, col) => {
    if (validMoves.has(`${row}-${col}`)) {
      onMakeMove(row, col);
    }
  };

  if (!gameState) return null;

  const totalWidth = gameState.boardSize * CELL_SIZE;
  const totalHeight = gameState.boardSize * CELL_SIZE;

  const visibleRows = [];
  console.log('VirtualizedBoard rendering. Visible range:', visibleRange);
  console.log('Valid moves:', validMoves);
  
  for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
    const cells = [];
    for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
      const cell = gameState.board[row][col];
      const isValidMove = validMoves.has(`${row}-${col}`);
      const isFlipping = flippingPieces.has(`${row}-${col}`);
      const isPlacing = placingPieces.has(`${row}-${col}`);
      
      if (isValidMove) {
        console.log(`Rendering valid move at [${row}, ${col}]`);
      }
      
      const getAnimationClass = () => {
        if (isFlipping) return 'flipping';
        if (isPlacing) return 'placing';
        return '';
      };
      
      cells.push(
        <Cell
          key={`${row}-${col}`}
          $clickable={isValidMove}
          $left={col * CELL_SIZE}
          onClick={() => handleCellClick(row, col)}
        >
          {cell !== 0 && (
            <Piece 
              $player={cell} 
              className={getAnimationClass()}
            />
          )}
          {isValidMove && (
            <div style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#FFD700',
              opacity: 1,
              border: '1px solid #FFA500'
            }} />
          )}
        </Cell>
      );
    }

    visibleRows.push(
      <VirtualRow
        key={row}
        $top={row * CELL_SIZE}
        $height={CELL_SIZE}
      >
        {cells}
      </VirtualRow>
    );
  }

  return (
    <VirtualContainer ref={containerRef}>
      <VirtualBoard $totalWidth={totalWidth} $totalHeight={totalHeight}>
        {visibleRows}
      </VirtualBoard>
    </VirtualContainer>
  );
}

export default VirtualizedBoard;
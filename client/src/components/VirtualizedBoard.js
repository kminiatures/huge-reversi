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
`;

const CELL_SIZE = 20;
const BUFFER_SIZE = 5;

function VirtualizedBoard({ gameState, onMakeMove, validMoves }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(600);

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
      
      if (isValidMove) {
        console.log(`Rendering valid move at [${row}, ${col}]`);
      }
      
      cells.push(
        <Cell
          key={`${row}-${col}`}
          $clickable={isValidMove}
          $left={col * CELL_SIZE}
          onClick={() => handleCellClick(row, col)}
        >
          {cell !== 0 && <Piece $player={cell} />}
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
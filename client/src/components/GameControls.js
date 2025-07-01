import React from 'react';
import styled from 'styled-components';

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  background-color: #2a2a2a;
  border-radius: 10px;
  margin: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 10px;
  font-size: 16px;
  border: 2px solid #4CAF50;
  border-radius: 5px;
  background-color: #333;
  color: white;
  width: 250px;
  
  &:focus {
    outline: none;
    border-color: #66BB6A;
  }
`;

const JoinButton = styled.button`
  padding: 15px 30px;
  font-size: 18px;
  font-weight: bold;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div`
  font-size: 14px;
  color: ${props => props.$connected ? '#4CAF50' : '#f44336'};
`;

function GameControls({ gameId, setGameId, playerName, setPlayerName, onJoinGame, connected }) {
  const canJoin = connected && gameId.trim() && playerName.trim();

  return (
    <ControlsContainer>
      <StatusIndicator $connected={connected}>
        {connected ? '🟢 サーバーに接続済み' : '🔴 サーバーに接続中...'}
      </StatusIndicator>
      
      <InputGroup>
        <Label>ゲームID:</Label>
        <Input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="ゲームIDを入力"
        />
      </InputGroup>
      
      <InputGroup>
        <Label>プレイヤー名:</Label>
        <Input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="あなたの名前を入力"
        />
      </InputGroup>
      
      <JoinButton 
        onClick={onJoinGame}
        disabled={!canJoin}
      >
        ゲームに参加
      </JoinButton>
    </ControlsContainer>
  );
}

export default GameControls;
import React, { useState, useEffect, useRef } from 'react';
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

const GameInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const GameInfo = styled.div`
  background-color: #2a2a2a;
  border-radius: 10px;
  padding: 20px;
  border: 2px solid #4CAF50;
  min-width: 250px;
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

const TurnIndicator = styled.div`
  background-color: ${props => props.$isMyTurn ? '#4CAF50' : '#333'};
  border: 3px solid ${props => props.$isMyTurn ? '#66BB6A' : '#555'};
  border-radius: 10px;
  padding: 15px;
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  color: ${props => props.$isMyTurn ? 'white' : '#ccc'};
  box-shadow: ${props => props.$isMyTurn ? '0 0 20px rgba(76, 175, 80, 0.5)' : 'none'};
  animation: ${props => props.$isMyTurn ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
    }
    50% {
      box-shadow: 0 0 30px rgba(76, 175, 80, 0.8);
    }
    100% {
      box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
    }
  }
`;

const MyTurnText = styled.div`
  font-size: 18px;
  margin-bottom: 5px;
`;

const CurrentPlayerText = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const ScoreBoard = styled.div`
  background-color: #2a2a2a;
  border-radius: 10px;
  padding: 20px;
  border: 2px solid #4CAF50;
  min-width: 250px;
`;

const ScoreTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 15px;
  text-align: center;
`;

const PlayerScore = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  border-radius: 8px;
  background-color: ${props => props.$isCurrentPlayer ? 'rgba(76, 175, 80, 0.2)' : '#333'};
  border: 2px solid ${props => props.$isCurrentPlayer ? '#4CAF50' : '#555'};
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PlayerPiece = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.$playerNumber === 1 ? '#000000' : '#ffffff'};
  border: 2px solid ${props => props.$playerNumber === 1 ? '#333333' : '#cccccc'};
`;

const PlayerName = styled.span`
  font-weight: bold;
  color: ${props => props.$isMe ? '#FFD700' : 'white'};
`;

const ScoreValue = styled.span`
  font-size: 20px;
  font-weight: bold;
  color: #4CAF50;
`;

const ChatContainer = styled.div`
  background-color: #2a2a2a;
  border-radius: 10px;
  padding: 20px;
  border: 2px solid #4CAF50;
  min-width: 250px;
  height: 300px;
  display: flex;
  flex-direction: column;
`;

const ChatTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 15px;
  text-align: center;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: #333;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
  max-height: 200px;
`;

const ChatMessage = styled.div`
  margin-bottom: 8px;
  padding: 5px;
  border-radius: 5px;
  background-color: ${props => props.$isMe ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
`;

const MessageSender = styled.span`
  font-weight: bold;
  color: ${props => props.$isMe ? '#FFD700' : '#4CAF50'};
  font-size: 12px;
`;

const MessageText = styled.div`
  color: white;
  margin-top: 2px;
  word-wrap: break-word;
`;

const MessageTime = styled.span`
  font-size: 10px;
  color: #999;
  margin-left: 5px;
`;

const ChatInput = styled.div`
  display: flex;
  gap: 10px;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid #555;
  border-radius: 5px;
  background-color: #444;
  color: white;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
`;

const SendButton = styled.button`
  padding: 8px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background-color: #45a049;
  }
  
  &:disabled {
    background-color: #666;
    cursor: not-allowed;
  }
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatMessagesRef = useRef(null);

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

    newSocket.on('chatMessage', (chatData) => {
      setChatMessages(prev => [...prev, chatData]);
    });

    return () => newSocket.close();
  }, []);

  // チャットメッセージが更新されたら自動スクロール
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

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

  const sendMessage = () => {
    if (socket && gameState && messageInput.trim()) {
      socket.emit('chatMessage', { 
        gameId: gameState.gameId, 
        message: messageInput.trim() 
      });
      setMessageInput('');
    }
  };

  const handleMessageKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
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
        <GameContainer>
          {gameState && gameState.boardSize > 16 ? (
            <VirtualizedBoard 
              gameState={gameState} 
              onMakeMove={makeMove}
              validMoves={(() => {
                if (!gameState?.gameStarted) return new Set();
                const currentPlayer = gameState.players[gameState.currentPlayer];
                const isMyTurn = currentPlayer?.playerName === playerName;
                return isMyTurn ? calculateValidMoves(gameState) : new Set();
              })()}
            />
          ) : (
            <GameBoard 
              gameState={gameState} 
              onMakeMove={makeMove}
              validMoves={(() => {
                if (!gameState?.gameStarted) return new Set();
                const currentPlayer = gameState.players[gameState.currentPlayer];
                const isMyTurn = currentPlayer?.playerName === playerName;
                return isMyTurn ? calculateValidMoves(gameState) : new Set();
              })()}
            />
          )}
          
          <GameInfoContainer>
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
            </GameInfo>
            
            {gameState?.gameStarted && (() => {
              const currentPlayer = gameState.players[gameState.currentPlayer];
              const isMyTurn = currentPlayer?.playerName === playerName;
              
              return (
                <>
                  <TurnIndicator $isMyTurn={isMyTurn}>
                    <MyTurnText>
                      {isMyTurn ? '🎯 あなたの番です！' : '⏳ 相手の番です'}
                    </MyTurnText>
                    <CurrentPlayerText>
                      現在のプレイヤー: {currentPlayer?.playerName}
                    </CurrentPlayerText>
                  </TurnIndicator>
                  
                  <ScoreBoard>
                    <ScoreTitle>📊 現在のスコア</ScoreTitle>
                    {gameState.players.map((player, index) => {
                      const isCurrentPlayer = gameState.currentPlayer === index;
                      const isMe = player.playerName === playerName;
                      const score = gameState.scores[player.playerNumber] || 0;
                      
                      return (
                        <PlayerScore key={player.playerNumber} $isCurrentPlayer={isCurrentPlayer}>
                          <PlayerInfo>
                            <PlayerPiece $playerNumber={player.playerNumber} />
                            <PlayerName $isMe={isMe}>
                              {player.playerName}
                              {isMe && ' (あなた)'}
                            </PlayerName>
                          </PlayerInfo>
                          <ScoreValue>{score}</ScoreValue>
                        </PlayerScore>
                      );
                    })}
                  </ScoreBoard>
                  
                  <ChatContainer>
                    <ChatTitle>💬 チャット</ChatTitle>
                    <ChatMessages ref={chatMessagesRef}>
                      {chatMessages.map((msg, index) => {
                        const isMe = msg.playerName === playerName;
                        const time = new Date(msg.timestamp).toLocaleTimeString('ja-JP', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        });
                        
                        return (
                          <ChatMessage key={index} $isMe={isMe}>
                            <div>
                              <MessageSender $isMe={isMe}>
                                {msg.playerName}
                                {isMe && ' (あなた)'}
                              </MessageSender>
                              <MessageTime>{time}</MessageTime>
                            </div>
                            <MessageText>{msg.message}</MessageText>
                          </ChatMessage>
                        );
                      })}
                    </ChatMessages>
                    <ChatInput>
                      <MessageInput
                        type="text"
                        placeholder="メッセージを入力..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleMessageKeyPress}
                        maxLength={200}
                      />
                      <SendButton 
                        onClick={sendMessage}
                        disabled={!messageInput.trim()}
                      >
                        送信
                      </SendButton>
                    </ChatInput>
                  </ChatContainer>
                </>
              );
            })()}
          </GameInfoContainer>
        </GameContainer>
      )}
    </AppContainer>
  );
}

export default App;
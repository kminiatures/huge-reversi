# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Main Development
- `npm run dev` - Start both server and client concurrently for development
- `npm run server:dev` - Start only the Node.js server with nodemon
- `npm run client:dev` - Start only the React client development server

### Build and Production
- `npm run build` - Build the React client for production
- `npm start` - Start the production server (requires client to be built first)

### Testing
- `cd client && npm test` - Run React tests with Jest

## Architecture Overview

This is a real-time multiplayer Reversi/Othello game supporting large board sizes (up to 32x32).

### Server Architecture (Node.js + Express + Socket.io)
- **server/index.js** - Main server file with Socket.io event handlers
- **server/gameManager.js** - Manages multiple game instances and player connections
- **server/reversiGame.js** - Core game logic including move validation, board state, and win conditions

Key server events:
- `joinGame` - Player joins a game room
- `makeMove` - Player makes a move (validated server-side)
- `gameState` - Broadcast updated game state to all players
- `gameOver` - Game completion notification

### Client Architecture (React + Socket.io-client)
- **client/src/App.js** - Main app component with Socket.io connection management
- **client/src/components/GameBoard.js** - Standard board renderer for ≤16x16 boards
- **client/src/components/VirtualizedBoard.js** - Virtualized renderer for >16x16 boards (performance optimization)
- **client/src/components/GameControls.js** - Game joining UI

### Board Size Optimization
The app automatically switches between rendering modes:
- Boards ≤16x16: Standard DOM grid rendering
- Boards >16x16: Virtualized rendering (only visible cells rendered)

### Game Logic
- Default board size: 32x32 (configurable in ReversiGame constructor)
- Standard Reversi rules with piece flipping
- Turn-based gameplay with move validation
- Real-time synchronization via WebSocket

### Key Technical Details
- Server runs on port 5000, client on port 3000 in development
- CORS configured for localhost development
- Game state includes board, players, current turn, and scores
- Move validation happens server-side to prevent cheating
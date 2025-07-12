import React, { useState, useEffect } from 'react';
import './App.css';
import Board3D from './components/Board3D';
import GameInfo from './components/GameInfo';
import PositionKey from './components/PositionKey';
import { GameState, GameScore, Position, GameHistoryItem } from './types/game';
import { initializeGameState, makeMove } from './utils/gameLogic';
import { submitGameRecord } from './lib/aws-storage';

function App() {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [score, setScore] = useState<GameScore>({ X: 0, O: 0, draws: 0 });
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
  const [showDrawNote, setShowDrawNote] = useState(true);
  const [playerName, setPlayerName] = useState<string>('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [hasShownNamePrompt, setHasShownNamePrompt] = useState(false);

  useEffect(() => {
    const savedScore = localStorage.getItem('ticTacToeScore');
    const savedHistory = localStorage.getItem('ticTacToeHistory');
    const savedName = localStorage.getItem('playerName');
    
    if (savedScore) {
      setScore(JSON.parse(savedScore));
    }
    
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      setGameHistory(history.map((game: any) => ({
        ...game,
        timestamp: new Date(game.timestamp)
      })));
    }

    if (savedName) {
      setPlayerName(savedName);
      setHasShownNamePrompt(true);
    } else {
      // Show name prompt after a short delay to let the game load
      setTimeout(() => {
        if (!hasShownNamePrompt) {
          setShowNamePrompt(true);
          setHasShownNamePrompt(true);
        }
      }, 500);
    }
  }, [hasShownNamePrompt]);

  useEffect(() => {
    localStorage.setItem('ticTacToeScore', JSON.stringify(score));
  }, [score]);

  useEffect(() => {
    localStorage.setItem('ticTacToeHistory', JSON.stringify(gameHistory));
  }, [gameHistory]);

  const handleCellClick = (position: Position) => {
    if (gameState.winner || gameState.isDraw) {
      return;
    }

    const newGameState = makeMove(gameState, position);
    setGameState(newGameState);

    if (newGameState.winner || newGameState.isDraw) {
      const gameResult = newGameState.winner || 'draw';
      
      setScore(prevScore => ({
        ...prevScore,
        [gameResult === 'draw' ? 'draws' : gameResult]: prevScore[gameResult === 'draw' ? 'draws' : gameResult] + 1
      }));

      setGameHistory(prevHistory => [
        ...prevHistory,
        { winner: gameResult, timestamp: new Date(), moveCount: newGameState.moveCount }
      ]);

      // Submit to global scoreboard
      console.log('Submitting game record:', {
        playerName: playerName || 'Anonymous',
        winner: gameResult,
        moveCount: newGameState.moveCount
      });
      
      submitGameRecord(
        playerName || 'Anonymous',
        gameResult as 'X' | 'O' | 'draw',
        newGameState.moveCount
      ).then(result => {
        console.log('submitGameRecord result:', result);
      }).catch(error => {
        console.error('submitGameRecord error:', error);
      });
    }
  };

  useEffect(() => {
    const keyToPosition: { [key: string]: Position } = {
      // Top layer
      'a': { layer: 0, row: 0, col: 0 },
      'b': { layer: 0, row: 0, col: 1 },
      'c': { layer: 0, row: 0, col: 2 },
      'd': { layer: 0, row: 1, col: 0 },
      'e': { layer: 0, row: 1, col: 1 },
      'f': { layer: 0, row: 1, col: 2 },
      'g': { layer: 0, row: 2, col: 0 },
      'h': { layer: 0, row: 2, col: 1 },
      'i': { layer: 0, row: 2, col: 2 },
      // Middle layer
      'j': { layer: 1, row: 0, col: 0 },
      'k': { layer: 1, row: 0, col: 1 },
      'l': { layer: 1, row: 0, col: 2 },
      'm': { layer: 1, row: 1, col: 0 },
      '0': { layer: 1, row: 1, col: 1 },
      'n': { layer: 1, row: 1, col: 2 },
      'o': { layer: 1, row: 2, col: 0 },
      'p': { layer: 1, row: 2, col: 1 },
      'q': { layer: 1, row: 2, col: 2 },
      // Bottom layer
      'r': { layer: 2, row: 0, col: 0 },
      's': { layer: 2, row: 0, col: 1 },
      't': { layer: 2, row: 0, col: 2 },
      'u': { layer: 2, row: 1, col: 0 },
      'v': { layer: 2, row: 1, col: 1 },
      'w': { layer: 2, row: 1, col: 2 },
      'x': { layer: 2, row: 2, col: 0 },
      'y': { layer: 2, row: 2, col: 1 },
      'z': { layer: 2, row: 2, col: 2 }
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if game is over, if a modifier key is pressed, or if name prompt is showing
      if (gameState.winner || gameState.isDraw || event.ctrlKey || event.metaKey || event.altKey || showNamePrompt) {
        return;
      }

      const key = event.key.toLowerCase();
      const position = keyToPosition[key];

      if (position) {
        // Check if the cell is empty before placing
        if (gameState.board[position.layer][position.row][position.col] === null) {
          handleCellClick(position);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, handleCellClick, showNamePrompt]);

  const handleNewGame = () => {
    setGameState(initializeGameState());
  };

  const handleSetPlayerName = (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      setPlayerName(trimmedName);
      localStorage.setItem('playerName', trimmedName);
      setShowNamePrompt(false);
    }
  };

  return (
    <div className="App">
      {showNamePrompt && (
        <div className="name-prompt-overlay">
          <div className="name-prompt">
            <h2>Welcome to 3D Tic-Tac-Toe!</h2>
            <p>Enter your name for the global leaderboard:</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector('input');
              if (input) handleSetPlayerName(input.value);
            }}>
              <input
                type="text"
                placeholder="Your name"
                maxLength={20}
                autoFocus
              />
              <button type="submit">Start Playing</button>
            </form>
          </div>
        </div>
      )}
      {showDrawNote && (
        <div className="draw-note">
          <p>Note: Draws are theoretically possible in 3D Tic-Tac-Toe but extremely rare due to the many winning lines available.</p>
          <button className="close-note" onClick={() => setShowDrawNote(false)}>×</button>
        </div>
      )}
      <header className="App-header">
        <h1>3D Tic-Tac-Toe</h1>
        <div className="header-score">
          Player (O): {score.O} win{score.O !== 1 ? 's' : ''} &nbsp;&nbsp;&nbsp; Computer (X): {score.X} win{score.X !== 1 ? 's' : ''}
        </div>
      </header>
      {(gameState.winner || gameState.isDraw) && (
        <div className="game-end-overlay">
          <div className="game-end-message">
            {gameState.winner ? `Player ${gameState.winner} wins!` : "It's a draw!"}
          </div>
          <button className="play-again-btn" onClick={handleNewGame}>
            Play Again
          </button>
        </div>
      )}
      <div className="game-container">
        <div className="board-container">
          <Board3D
            board={gameState.board}
            winningLine={gameState.winningLine}
          />
        </div>
        <div className="info-container">
          <GameInfo
            currentPlayer={gameState.currentPlayer}
            winner={gameState.winner}
            isDraw={gameState.isDraw}
            score={score}
            gameHistory={gameHistory}
            onNewGame={handleNewGame}
          />
        </div>
      </div>
      <PositionKey board={gameState.board} winningLine={gameState.winningLine} />
    </div>
  );
}

export default App;

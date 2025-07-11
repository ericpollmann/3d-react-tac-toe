import React, { useState, useEffect } from 'react';
import './App.css';
import Board3D from './components/Board3D';
import GameInfo from './components/GameInfo';
import { GameState, GameScore, Position } from './types/game';
import { initializeGameState, makeMove } from './utils/gameLogic';

function App() {
  const [gameState, setGameState] = useState<GameState>(initializeGameState());
  const [score, setScore] = useState<GameScore>({ X: 0, O: 0, draws: 0 });
  const [gameHistory, setGameHistory] = useState<Array<{ winner: 'X' | 'O' | 'draw' | null; timestamp: Date }>>([]);

  useEffect(() => {
    const savedScore = localStorage.getItem('ticTacToeScore');
    const savedHistory = localStorage.getItem('ticTacToeHistory');
    
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
  }, []);

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
        { winner: gameResult, timestamp: new Date() }
      ]);
    }
  };

  const handleNewGame = () => {
    setGameState(initializeGameState());
  };

  return (
    <div className="App">
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
            onCellClick={handleCellClick}
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
    </div>
  );
}

export default App;

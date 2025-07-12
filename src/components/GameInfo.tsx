import React, { useState } from 'react';
import { Player, GameScore, GameHistoryItem } from '../types/game';
import './GameInfo.css';

interface GameInfoProps {
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  score: GameScore;
  gameHistory: GameHistoryItem[];
  onNewGame: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({
  currentPlayer,
  winner,
  isDraw,
  score,
  gameHistory,
  onNewGame,
}) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'records'>('recent');

  const getGameStatus = () => {
    if (winner) {
      return `Player ${winner} wins!`;
    }
    if (isDraw) {
      return "It's a draw!";
    }
    return `Current player: ${currentPlayer}`;
  };

  const last5Games = gameHistory.slice(-5).reverse();

  // Get wins only (no draws) for move records
  const wins = gameHistory.filter(game => game.winner !== 'draw' && game.winner !== null);
  
  // Find least and most move wins
  const leastMoveWin = wins.length > 0 
    ? wins.reduce((min, game) => game.moveCount < min.moveCount ? game : min)
    : null;
    
  const mostMoveWin = wins.length > 0
    ? wins.reduce((max, game) => game.moveCount > max.moveCount ? game : max)
    : null;

  return (
    <div className="game-info">
      <div className="status-section">
        <h2 className="game-status">{getGameStatus()}</h2>
        {(winner || isDraw) && (
          <button className="new-game-btn" onClick={onNewGame}>
            New Game
          </button>
        )}
      </div>

      <div className="score-section">
        <h3>Score</h3>
        <div className="score-board">
          <div className="score-item">
            <span className="player-label player-x">Player X</span>
            <span className="score-value">{score.X}</span>
          </div>
          <div className="score-item">
            <span className="player-label player-o">Player O</span>
            <span className="score-value">{score.O}</span>
          </div>
          <div className="score-item">
            <span className="player-label">Draws</span>
            <span className="score-value">{score.draws}</span>
          </div>
        </div>
      </div>

      <div className="history-section">
        <div className="history-tabs">
          <button 
            className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Last 5 Games
          </button>
          <button 
            className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            Move Records
          </button>
        </div>
        
        <div className="game-history">
          {activeTab === 'recent' ? (
            last5Games.length === 0 ? (
              <p className="no-history">No games played yet</p>
            ) : (
              last5Games.map((game, index) => (
                <div key={index} className="history-item">
                  <span className="history-number">#{gameHistory.length - gameHistory.indexOf(game)}</span>
                  <span className="history-result">
                    {game.winner === 'draw' ? 'Draw' : `${game.winner} won`}
                  </span>
                  <span className="history-moves">{game.moveCount} moves</span>
                </div>
              ))
            )
          ) : (
            <div className="move-records">
              <div className="record-item">
                <span className="record-label">Fewest Moves Win:</span>
                {leastMoveWin ? (
                  <span className="record-value">
                    {leastMoveWin.winner} - {leastMoveWin.moveCount} moves
                  </span>
                ) : (
                  <span className="record-empty">No wins yet</span>
                )}
              </div>
              <div className="record-item">
                <span className="record-label">Most Moves Win:</span>
                {mostMoveWin ? (
                  <span className="record-value">
                    {mostMoveWin.winner} - {mostMoveWin.moveCount} moves
                  </span>
                ) : (
                  <span className="record-empty">No wins yet</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
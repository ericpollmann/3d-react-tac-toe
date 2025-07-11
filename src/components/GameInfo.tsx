import React from 'react';
import { Player, GameScore } from '../types/game';
import './GameInfo.css';

interface GameInfoProps {
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  score: GameScore;
  gameHistory: Array<{ winner: Player | 'draw' | null; timestamp: Date }>;
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
        <h3>Last 5 Games</h3>
        <div className="game-history">
          {last5Games.length === 0 ? (
            <p className="no-history">No games played yet</p>
          ) : (
            last5Games.map((game, index) => (
              <div key={index} className="history-item">
                <span className="history-number">#{gameHistory.length - index}</span>
                <span className="history-result">
                  {game.winner === 'draw' ? 'Draw' : `${game.winner} won`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
import React, { useState, useEffect } from 'react';
import { getTopScores, submitScore, GlobalScore } from '../lib/supabase';
import './GlobalScoreboard.css';

interface GlobalScoreboardProps {
  localWins: number;
  leastMovesWin: number | null;
  mostMovesWin: number | null;
}

const GlobalScoreboard: React.FC<GlobalScoreboardProps> = ({
  localWins,
  leastMovesWin,
  mostMovesWin
}) => {
  const [scores, setScores] = useState<GlobalScore[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [lastSubmittedName, setLastSubmittedName] = useState(
    localStorage.getItem('ticTacToePlayerName') || ''
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScores();
    // Refresh scores every 30 seconds
    const interval = setInterval(loadScores, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadScores = async () => {
    try {
      setLoading(true);
      setError(null);
      const topScores = await getTopScores();
      setScores(topScores);
    } catch (err) {
      setError('Unable to load global scores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim() || localWins === 0) return;

    setIsSubmitting(true);
    const success = await submitScore(
      playerName.trim(),
      localWins,
      leastMovesWin,
      mostMovesWin
    );

    if (success) {
      localStorage.setItem('ticTacToePlayerName', playerName);
      setLastSubmittedName(playerName);
      setShowNameInput(false);
      await loadScores();
    }
    setIsSubmitting(false);
  };

  if (error) {
    return (
      <div className="global-scoreboard">
        <h3>🌍 Global Leaderboard</h3>
        <p className="error-message">Currently unavailable</p>
      </div>
    );
  }

  return (
    <div className="global-scoreboard">
      <h3>🌍 Global Leaderboard</h3>
      
      {localWins > 0 && (
        <div className="submit-section">
          {!showNameInput && !lastSubmittedName ? (
            <button 
              className="submit-btn"
              onClick={() => setShowNameInput(true)}
            >
              Submit Your Score
            </button>
          ) : showNameInput ? (
            <div className="name-input-group">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitScore()}
                maxLength={20}
              />
              <button 
                onClick={handleSubmitScore}
                disabled={!playerName.trim() || isSubmitting}
              >
                {isSubmitting ? '...' : 'Submit'}
              </button>
            </div>
          ) : (
            <div className="submitted-info">
              Playing as: <strong>{lastSubmittedName}</strong>
              <button 
                className="change-name-btn"
                onClick={() => {
                  setPlayerName(lastSubmittedName);
                  setShowNameInput(true);
                }}
              >
                Change
              </button>
            </div>
          )}
        </div>
      )}

      <div className="scores-list">
        {loading ? (
          <p className="loading">Loading scores...</p>
        ) : scores.length === 0 ? (
          <p className="no-scores">No scores yet. Be the first!</p>
        ) : (
          scores.map((score, index) => (
            <div 
              key={score.id} 
              className={`score-entry ${score.player_name === lastSubmittedName ? 'current-player' : ''}`}
            >
              <span className="rank">#{index + 1}</span>
              <span className="player-name">{score.player_name}</span>
              <span className="wins">{score.wins} wins</span>
              {score.least_moves_win && (
                <span className="record" title="Fewest moves to win">
                  ⚡ {score.least_moves_win}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GlobalScoreboard;
import React, { useState, useEffect } from 'react';
import { Player, GameScore, GameHistoryItem } from '../types/game';
import { getRecentGames, getGameRecords, GlobalGameRecord } from '../lib/lambda-storage';
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
  const [globalRecentGames, setGlobalRecentGames] = useState<GlobalGameRecord[]>([]);
  const [globalRecords, setGlobalRecords] = useState<{
    leastMoves: GlobalGameRecord | null;
    mostMoves: GlobalGameRecord | null;
  }>({ leastMoves: null, mostMoves: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGlobalData();
    // Refresh every 30 seconds
    const interval = setInterval(loadGlobalData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const [recentGames, records] = await Promise.all([
        getRecentGames(),
        getGameRecords()
      ]);
      setGlobalRecentGames(recentGames);
      setGlobalRecords(records);
    } catch (error) {
      console.error('Error loading global data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameStatus = () => {
    if (winner) {
      return `Player ${winner} wins!`;
    }
    if (isDraw) {
      return "It's a draw!";
    }
    return `Current player: ${currentPlayer}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

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
        <h3>Your Score</h3>
        <div className="score-board">
          <div className="score-item">
            <span className="player-label player-x">Player X</span>
            <span className="score-value">{score.X}</span>
          </div>
          <div className="score-item">
            <span className="player-label player-o">Player O</span>
            <span className="score-value">{score.O}</span>
          </div>
        </div>
      </div>

      <div className="history-section">
        <div className="history-tabs">
          <button 
            className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            🌍 Last 5 Games
          </button>
          <button 
            className={`tab-button ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            🏆 Move Records
          </button>
        </div>
        
        <div className="game-history">
          {activeTab === 'recent' ? (
            loading ? (
              <p className="loading">Loading global games...</p>
            ) : globalRecentGames.length === 0 ? (
              <p className="no-history">No global games yet</p>
            ) : (
              globalRecentGames.map((game, index) => (
                <div key={game.id || index} className="history-item global-game">
                  <span className="player-name">{game.player_name}</span>
                  <span className="history-result">
                    {game.winner === 'draw' ? 'Draw' : `${game.winner} won`}
                  </span>
                  <span className="history-moves">{game.move_count} moves</span>
                  <span className="history-time">{formatDate(game.created_at)}</span>
                </div>
              ))
            )
          ) : (
            <div className="move-records">
              {loading ? (
                <p className="loading">Loading records...</p>
              ) : (
                <>
                  <div className="record-item">
                    <span className="record-label">🚀 Fewest Moves Win:</span>
                    {globalRecords.leastMoves ? (
                      <span className="record-value">
                        {globalRecords.leastMoves.player_name} - {globalRecords.leastMoves.winner} - {globalRecords.leastMoves.move_count} moves
                      </span>
                    ) : (
                      <span className="record-empty">No wins yet</span>
                    )}
                  </div>
                  <div className="record-item">
                    <span className="record-label">🎯 Most Moves Win:</span>
                    {globalRecords.mostMoves ? (
                      <span className="record-value">
                        {globalRecords.mostMoves.player_name} - {globalRecords.mostMoves.winner} - {globalRecords.mostMoves.move_count} moves
                      </span>
                    ) : (
                      <span className="record-empty">No wins yet</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameInfo;
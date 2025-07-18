import React from 'react';
import './PositionKey.css';
import { CellValue, Position } from '../types/game';

interface PositionKeyProps {
  board: CellValue[][][];
  winningLine: Position[] | null;
}

const PositionKey: React.FC<PositionKeyProps> = ({ board, winningLine }) => {
  const layers = [
    { name: 'Top', positions: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] },
    { name: 'Middle', positions: ['j', 'k', 'l', 'm', '0', 'n', 'o', 'p', 'q'] },
    { name: 'Bottom', positions: ['r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'] }
  ];

  const getCellContent = (layerIndex: number, positionIndex: number) => {
    const row = Math.floor(positionIndex / 3);
    const col = positionIndex % 3;
    const cellValue = board[layerIndex][row][col];
    return cellValue !== null ? cellValue : layers[layerIndex].positions[positionIndex];
  };

  return (
    <div className="position-key">
      <h3>Position Key</h3>
      <div className="key-subtitle">Press letter keys to play</div>
      {layers.map((layer, layerIndex) => (
        <div key={layerIndex} className="layer-key">
          <div className="layer-name">{layer.name}</div>
          <div className="position-grid">
            {layer.positions.map((pos, index) => {
              const row = Math.floor(index / 3);
              const col = index % 3;
              const cellValue = board[layerIndex][row][col];
              const isOccupied = cellValue !== null;
              const isWinning = winningLine?.some(
                (p) => p.layer === layerIndex && p.row === row && p.col === col
              ) || false;
              
              return (
                <div 
                  key={index} 
                  className={`position-cell ${isOccupied ? 'occupied' : ''} ${isWinning ? 'winning' : ''}`}
                >
                  {isOccupied ? (
                    cellValue === 'X' ? (
                      <div className={`x-piece ${isWinning ? 'winning-piece' : ''}`}>
                        <div className="x-line x-line-1"></div>
                        <div className="x-line x-line-2"></div>
                      </div>
                    ) : (
                      <div className={`o-piece ${isWinning ? 'winning-piece' : ''}`}></div>
                    )
                  ) : (
                    pos
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PositionKey;
import { CellValue, GameState, Player, Position } from '../types/game';

export const initializeBoard = (): CellValue[][][] => {
  return Array(3).fill(null).map(() =>
    Array(3).fill(null).map(() =>
      Array(3).fill(null)
    )
  );
};

export const initializeGameState = (): GameState => ({
  board: initializeBoard(),
  currentPlayer: 'X',
  winner: null,
  isDraw: false,
  winningLine: null,
  moveCount: 0,
});

const checkLine = (board: CellValue[][][], positions: Position[]): Player | null => {
  const values = positions.map(p => board[p.layer][p.row][p.col]);
  const firstValue = values[0];
  
  if (firstValue && values.every(v => v === firstValue)) {
    return firstValue;
  }
  
  return null;
};

export const checkWinner = (board: CellValue[][][]): { winner: Player | null; winningLine: Position[] | null } => {
  const lines: Position[][] = [];
  
  // Check rows in each layer
  for (let layer = 0; layer < 3; layer++) {
    for (let row = 0; row < 3; row++) {
      lines.push([
        { layer, row, col: 0 },
        { layer, row, col: 1 },
        { layer, row, col: 2 },
      ]);
    }
  }
  
  // Check columns in each layer
  for (let layer = 0; layer < 3; layer++) {
    for (let col = 0; col < 3; col++) {
      lines.push([
        { layer, row: 0, col },
        { layer, row: 1, col },
        { layer, row: 2, col },
      ]);
    }
  }
  
  // Check diagonals in each layer
  for (let layer = 0; layer < 3; layer++) {
    lines.push([
      { layer, row: 0, col: 0 },
      { layer, row: 1, col: 1 },
      { layer, row: 2, col: 2 },
    ]);
    lines.push([
      { layer, row: 0, col: 2 },
      { layer, row: 1, col: 1 },
      { layer, row: 2, col: 0 },
    ]);
  }
  
  // Check vertical lines through layers
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      lines.push([
        { layer: 0, row, col },
        { layer: 1, row, col },
        { layer: 2, row, col },
      ]);
    }
  }
  
  // Check diagonals through layers
  // Main diagonals
  lines.push([
    { layer: 0, row: 0, col: 0 },
    { layer: 1, row: 1, col: 1 },
    { layer: 2, row: 2, col: 2 },
  ]);
  lines.push([
    { layer: 0, row: 0, col: 2 },
    { layer: 1, row: 1, col: 1 },
    { layer: 2, row: 2, col: 0 },
  ]);
  lines.push([
    { layer: 0, row: 2, col: 0 },
    { layer: 1, row: 1, col: 1 },
    { layer: 2, row: 0, col: 2 },
  ]);
  lines.push([
    { layer: 0, row: 2, col: 2 },
    { layer: 1, row: 1, col: 1 },
    { layer: 2, row: 0, col: 0 },
  ]);
  
  // Edge diagonals through layers
  for (let i = 0; i < 3; i++) {
    // Row diagonals
    lines.push([
      { layer: 0, row: i, col: 0 },
      { layer: 1, row: i, col: 1 },
      { layer: 2, row: i, col: 2 },
    ]);
    lines.push([
      { layer: 0, row: i, col: 2 },
      { layer: 1, row: i, col: 1 },
      { layer: 2, row: i, col: 0 },
    ]);
    
    // Column diagonals
    lines.push([
      { layer: 0, row: 0, col: i },
      { layer: 1, row: 1, col: i },
      { layer: 2, row: 2, col: i },
    ]);
    lines.push([
      { layer: 0, row: 2, col: i },
      { layer: 1, row: 1, col: i },
      { layer: 2, row: 0, col: i },
    ]);
  }
  
  // Check all lines for a winner
  for (const line of lines) {
    const winner = checkLine(board, line);
    if (winner) {
      return { winner, winningLine: line };
    }
  }
  
  return { winner: null, winningLine: null };
};

export const checkDraw = (board: CellValue[][][]): boolean => {
  return board.every(layer =>
    layer.every(row =>
      row.every(cell => cell !== null)
    )
  );
};

export const makeMove = (
  gameState: GameState,
  position: Position
): GameState => {
  const { board, currentPlayer, moveCount } = gameState;
  const { layer, row, col } = position;
  
  // Check if cell is already occupied
  if (board[layer][row][col] !== null) {
    return gameState;
  }
  
  // Create new board with the move
  const newBoard = board.map((l, li) =>
    l.map((r, ri) =>
      r.map((c, ci) => {
        if (li === layer && ri === row && ci === col) {
          return currentPlayer;
        }
        return c;
      })
    )
  );
  
  // Check for winner
  const { winner, winningLine } = checkWinner(newBoard);
  
  // Check for draw
  const isDraw = !winner && checkDraw(newBoard);
  
  return {
    board: newBoard,
    currentPlayer: winner || isDraw ? currentPlayer : currentPlayer === 'X' ? 'O' : 'X',
    winner,
    isDraw,
    winningLine,
    moveCount: moveCount + 1,
  };
};
export type Player = 'X' | 'O';
export type CellValue = Player | null;

export interface Position {
  layer: number;
  row: number;
  col: number;
}

export interface GameState {
  board: CellValue[][][];
  currentPlayer: Player;
  winner: Player | null;
  isDraw: boolean;
  winningLine: Position[] | null;
  moveCount: number;
}

export interface GameScore {
  X: number;
  O: number;
  draws: number;
}

export interface GameHistoryItem {
  winner: Player | 'draw' | null;
  timestamp: Date;
  moveCount: number;
}

export interface GameHistory {
  games: GameHistoryItem[];
}
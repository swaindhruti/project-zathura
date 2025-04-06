export interface Puzzle {
  questionId: string;
  digits: number[];
}

export interface PuzzleResult {
  qId: string;
  user_ans: string;
  isCorrect: boolean;
  timeToSolve: number;
}

export interface Player {
  id: string;
  username: string;
  score: number;
  currentPuzzleIndex: number;
  isFinished: boolean;
}

export interface OnlinePlayer {
  id: string;
  username: string;
  difficulty: string | null;
  status: 'available' | 'playing' | 'away';
}

export interface GameInvitation {
  invitationId: string;
  fromPlayer: {
    id: string;
    username: string;
  };
  difficulty: string;
}

export type Player = 'white' | 'black';
export type PieceType = 'man' | 'king';

export interface Piece {
  player: Player;
  type: PieceType;
}

export type Board = (Piece | null)[][];

export interface Move {
  from: { r: number; c: number };
  to: { r: number; c: number };
  captured?: { r: number; c: number }[];
}

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = { player: 'black', type: 'man' };
        else if (r > 4) board[r][c] = { player: 'white', type: 'man' };
      }
    }
  }
  return board;
}

function getForwardDir(player: Player) {
  return player === 'white' ? -1 : 1;
}

function isInside(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// Simple evaluation for minimax
export function evaluateBoard(board: Board, player: Player): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = piece.type === 'king' ? 3 : 1;
        score += piece.player === player ? val : -val;
      }
    }
  }
  return score;
}

export function getValidMoves(board: Board, player: Player): Move[] {
  let moves: Move[] = [];
  let hasCaptures = false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.player === player) {
        const pieceCaptures = getCapturesForPiece(board, r, c, piece);
        if (pieceCaptures.length > 0) {
          if (!hasCaptures) {
            moves = []; // Reset simple moves if capture is found
            hasCaptures = true;
          }
          moves.push(...pieceCaptures);
        } else if (!hasCaptures) {
          moves.push(...getSimpleMovesForPiece(board, r, c, piece));
        }
      }
    }
  }
  return moves;
}

function getSimpleMovesForPiece(board: Board, r: number, c: number, piece: Piece): Move[] {
  const moves: Move[] = [];
  if (piece.type === 'man') {
    const dir = getForwardDir(piece.player);
    for (const dc of [-1, 1]) {
      const nr = r + dir;
      const nc = c + dc;
      if (isInside(nr, nc) && !board[nr][nc]) {
        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
      }
    }
  } else {
    // King moves
    const dirs = [[-1,-1], [-1,1], [1,-1], [1,1]];
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (isInside(nr, nc) && !board[nr][nc]) {
        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        nr += dr;
        nc += dc;
      }
    }
  }
  return moves;
}

// Recursive capture search
function getCapturesForPiece(board: Board, r: number, c: number, piece: Piece, currentCaptured: {r:number,c:number}[] = []): Move[] {
  const moves: Move[] = [];
  const dirs = [[-1,-1], [-1,1], [1,-1], [1,1]];

  if (piece.type === 'man') {
    let canCaptureMore = false;
    for (const [dr, dc] of dirs) {
      const jumpR = r + dr * 2;
      const jumpC = c + dc * 2;
      const midR = r + dr;
      const midC = c + dc;

      if (isInside(jumpR, jumpC)) {
        const midPiece = board[midR][midC];
        // Ensure midPiece is opponent and hasn't been captured already in this sequence
        if (midPiece && midPiece.player !== piece.player && !board[jumpR][jumpC] && !currentCaptured.some(cap => cap.r === midR && cap.c === midC)) {
          canCaptureMore = true;
          const newCaptured = [...currentCaptured, { r: midR, c: midC }];
          // Temporary apply move for deep search
          const newBoard = board.map(row => [...row]);
          newBoard[jumpR][jumpC] = piece;
          newBoard[r][c] = null;
          // Note: we do not remove the captured piece during the sequence search in Russian draughts, 
          // but we track it so we don't jump it twice.

          const furtherCaptures = getCapturesForPiece(newBoard, jumpR, jumpC, piece, newCaptured);
          if (furtherCaptures.length > 0) {
            moves.push(...furtherCaptures.map(m => ({ ...m, from: { r, c } })));
          } else {
            moves.push({ from: { r, c }, to: { r: jumpR, c: jumpC }, captured: newCaptured });
          }
        }
      }
    }
    if (!canCaptureMore && currentCaptured.length > 0) {
      // Base case handled implicitly by returning empty and letting caller add it
    }
  } else {
    // King captures
    for (const [dr, dc] of dirs) {
      let step = 1;
      let foundOpponent = false;
      let midR = -1, midC = -1;

      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (!isInside(nr, nc)) break;

        const p = board[nr][nc];
        if (p) {
          if (p.player === piece.player || currentCaptured.some(cap => cap.r === nr && cap.c === nc)) {
            break; // Blocked by own piece or already captured piece
          }
          if (!foundOpponent) {
            foundOpponent = true;
            midR = nr;
            midC = nc;
          } else {
            break; // Blocked by second piece
          }
        } else if (foundOpponent) {
          // Empty square after opponent -> valid landing spot
          const newCaptured = [...currentCaptured, { r: midR, c: midC }];
          const newBoard = board.map(row => [...row]);
          newBoard[nr][nc] = piece;
          newBoard[r][c] = null;

          const furtherCaptures = getCapturesForPiece(newBoard, nr, nc, piece, newCaptured);
          if (furtherCaptures.length > 0) {
            moves.push(...furtherCaptures.map(m => ({ ...m, from: { r, c } })));
          } else {
            moves.push({ from: { r, c }, to: { r: nr, c: nc }, captured: newCaptured });
          }
        }
        step++;
      }
    }
  }

  // Filter to keep only the longest capture sequences
  if (currentCaptured.length === 0 && moves.length > 0) {
    const maxLen = Math.max(...moves.map(m => m.captured?.length || 0));
    return moves.filter(m => (m.captured?.length || 0) === maxLen);
  }

  return moves;
}

export function applyMove(board: Board, move: Move): Board {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[move.from.r][move.from.c]!;
  
  newBoard[move.to.r][move.to.c] = piece;
  newBoard[move.from.r][move.from.c] = null;

  if (move.captured) {
    for (const cap of move.captured) {
      newBoard[cap.r][cap.c] = null;
    }
  }

  // Promotion
  if (piece.type === 'man') {
    if ((piece.player === 'white' && move.to.r === 0) || 
        (piece.player === 'black' && move.to.r === 7)) {
      newBoard[move.to.r][move.to.c] = { ...piece, type: 'king' };
    }
  }

  return newBoard;
}

// Minimax with Alpha-Beta Pruning
export function getBestMove(board: Board, player: Player, depth: number): Move | null {
  let bestMove: Move | null = null;
  let bestScore = -Infinity;
  const moves = getValidMoves(board, player);

  if (moves.length === 0) return null;

  for (const move of moves) {
    const newBoard = applyMove(board, move);
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, player);
    
    // Add small random noise to prevent identical games
    const randomizedScore = score + (Math.random() * 0.1);

    if (randomizedScore > bestScore) {
      bestScore = randomizedScore;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
}

function minimax(board: Board, depth: number, alpha: number, beta: number, isMaximizing: boolean, rootPlayer: Player): number {
  if (depth === 0) {
    return evaluateBoard(board, rootPlayer);
  }

  const currentPlayer = isMaximizing ? rootPlayer : (rootPlayer === 'white' ? 'black' : 'white');
  const moves = getValidMoves(board, currentPlayer);

  if (moves.length === 0) {
    return isMaximizing ? -1000 : 1000;
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const evalScore = minimax(applyMove(board, move), depth - 1, alpha, beta, false, rootPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const evalScore = minimax(applyMove(board, move), depth - 1, alpha, beta, true, rootPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

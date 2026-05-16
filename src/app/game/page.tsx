"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TopBar } from "@/components/TopBar";
import { useAppStore } from "@/store/useAppStore";
import { translations } from "@/lib/i18n";
import { createInitialBoard, getValidMoves, applyMove, getBestMove, Board, Move, Player } from "@/lib/checkers";
import { Clock, History as HistoryIcon, Flag, Crown, CheckCircle2, Lock } from "lucide-react";

function GameContent() {
  const router = useRouter();
  const { lang, openAuthModal } = useAppStore();
  const t = translations[lang].game;
  const tLanding = translations[lang].landing;

  const [board, setBoard] = useState<Board>(createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('white');
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  
  const [whiteTime, setWhiteTime] = useState(5 * 60);
  const [blackTime, setBlackTime] = useState(5 * 60);
  const [gameStatus, setGameStatus] = useState<'playing' | 'white_won' | 'black_won' | 'draw'>('playing');

  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const aiDepth = difficulty === "Сложно" ? 6 : difficulty === "Средне" ? 4 : 2;

  const checkGameEnd = useCallback((currentBoard: Board, nextPlayer: Player) => {
    const nextMoves = getValidMoves(currentBoard, nextPlayer);
    if (nextMoves.length === 0) {
      setGameStatus(nextPlayer === 'white' ? 'black_won' : 'white_won');
    }
  }, []);

  function formatMove(move: Move) {
    const cols = 'ABCDEFGH';
    const from = `${cols[move.from.c]}${8 - move.from.r}`;
    const to = `${cols[move.to.c]}${8 - move.to.r}`;
    return `${from} ${move.captured ? 'x' : '-'} ${to}`;
  }

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      if (currentPlayer === 'white') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            setGameStatus('black_won');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            setGameStatus('white_won');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPlayer, gameStatus]);

  useEffect(() => {
    if (currentPlayer === 'black' && gameStatus === 'playing') {
      const timeout = setTimeout(() => {
        const bestMove = getBestMove(board, 'black', aiDepth);
        if (bestMove) {
          const newBoard = applyMove(board, bestMove);
          setBoard(newBoard);
          setMoveHistory(prev => [...prev, formatMove(bestMove)]);
          setCurrentPlayer('white');
          checkGameEnd(newBoard, 'white');
        } else {
          setGameStatus('white_won');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, board, gameStatus, aiDepth, checkGameEnd]);

  const handleCellClick = (r: number, c: number) => {
    if (gameStatus !== 'playing' || currentPlayer !== 'white') return;

    // Clicked on own piece
    if (board[r][c]?.player === 'white') {
      const allMoves = getValidMoves(board, 'white');
      const pieceMoves = allMoves.filter(m => m.from.r === r && m.from.c === c);
      if (pieceMoves.length > 0) {
        setSelectedCell({ r, c });
        setValidMoves(pieceMoves);
      } else if (allMoves.some(m => m.captured && m.captured.length > 0)) {
        // If there are capture moves, but this piece has none, do nothing
        setSelectedCell(null);
        setValidMoves([]);
      } else {
        setSelectedCell({ r, c });
        setValidMoves([]);
      }
      return;
    }

    // Clicked on a valid destination
    if (selectedCell) {
      const move = validMoves.find(m => m.to.r === r && m.to.c === c);
      if (move) {
        const newBoard = applyMove(board, move);
        setBoard(newBoard);
        setMoveHistory(prev => [...prev, formatMove(move)]);
        setSelectedCell(null);
        setValidMoves([]);
        setCurrentPlayer('black');
        checkGameEnd(newBoard, 'black');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <TopBar titleKey="gameVsAi" />
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: Board Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F6F3] p-8">
          <button 
            onClick={() => router.push("/")}
            className="self-start mb-8 px-4 py-2 bg-white border border-[#EBEBEA] rounded-[8px] text-[13px] font-semibold hover:bg-gray-50 transition-colors"
          >
            {t.back}
          </button>
          
          <div className="w-[560px] h-[560px] bg-white border-[12px] border-[#D4C3A3] rounded-[8px] grid grid-cols-8 grid-rows-8 shadow-sm relative">
            {board.map((row, r) => 
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                const isValidMove = validMoves.some(m => m.to.r === r && m.to.c === c);
                const isLastMoveFrom = moveHistory.length > 0 && 
                  8 - parseInt(moveHistory[moveHistory.length - 1].split(' ')[0][1]) === r &&
                  'ABCDEFGH'.indexOf(moveHistory[moveHistory.length - 1].split(' ')[0][0]) === c;
                const isLastMoveTo = moveHistory.length > 0 && 
                  8 - parseInt(moveHistory[moveHistory.length - 1].split(' ')[2][1]) === r &&
                  'ABCDEFGH'.indexOf(moveHistory[moveHistory.length - 1].split(' ')[2][0]) === c;

                return (
                  <div 
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`relative flex items-center justify-center
                      ${isDark ? 'bg-[#8B7355]' : 'bg-[#E3D5C1]'}
                      ${isSelected ? 'ring-inset ring-4 ring-[#6366F1] z-10' : ''}
                      ${isLastMoveFrom || isLastMoveTo ? 'after:absolute after:inset-0 after:bg-yellow-400/30' : ''}
                    `}
                  >
                    {/* Move indicator */}
                    {isValidMove && (
                      <div className="absolute w-4 h-4 rounded-full bg-[#6366F1]/60 z-10" />
                    )}
                    
                    {/* Piece */}
                    {piece && (
                      <div className={`w-[85%] h-[85%] rounded-full shadow-md flex items-center justify-center z-20 transition-transform
                        ${piece.player === 'white' ? 'bg-[#FDFBF7] border-2 border-[#D4C3A3]' : 'bg-[#2A2A2A] border-2 border-[#1A1A1A]'}
                        ${isSelected ? 'scale-110' : ''}
                      `}>
                        {piece.type === 'king' && (
                          <Crown size={24} className={piece.player === 'white' ? 'text-[#D4C3A3]' : 'text-[#666]'} />
                        )}
                        {piece.type === 'man' && (
                          <div className={`w-[60%] h-[60%] rounded-full border border-black/10 
                            ${piece.player === 'white' ? 'bg-white/50' : 'bg-white/10'}`} 
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="w-[320px] bg-white border-l border-[#EBEBEA] flex flex-col h-full">
          {/* AI Profile */}
          <div className="p-6 border-b border-[#EBEBEA] bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                🤖
              </div>
              <div>
                <div className="font-semibold">{t.black}</div>
                <div className="text-[12px] text-gray-500">{tLanding.mediumAi}</div>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 font-mono text-[20px] font-semibold ${currentPlayer === 'black' ? 'text-black' : 'text-gray-400'}`}>
              <Clock size={16} /> {formatTime(blackTime)}
            </div>
          </div>

          {/* Move History */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
              <HistoryIcon size={16} />
              {tLanding.history}
            </div>
            
            <div className="space-y-1">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                <div key={i} className="flex text-[14px]">
                  <div className="w-8 text-gray-400 font-mono">{i + 1}.</div>
                  <div className="flex-1 font-mono">{moveHistory[i * 2]}</div>
                  <div className="flex-1 font-mono text-gray-500">{moveHistory[i * 2 + 1] || ''}</div>
                </div>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="p-6 border-t border-[#EBEBEA] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white border border-[#EBEBEA] rounded-full flex items-center justify-center text-gray-600">
                👤
              </div>
              <div>
                <div className="font-semibold">{t.white}</div>
                <div className="text-[12px] text-[#6366F1] font-semibold">{t.yourTurn}</div>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 font-mono text-[20px] font-semibold ${currentPlayer === 'white' ? 'text-black' : 'text-gray-400'}`}>
              <Clock size={16} /> {formatTime(whiteTime)}
            </div>
          </div>

          {/* Resign */}
          <div className="p-6 pt-0">
            <button 
              onClick={() => setGameStatus('black_won')}
              disabled={gameStatus !== 'playing'}
              className="w-full py-3 rounded-[8px] border border-[#EBEBEA] text-[14px] font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Flag size={16} />
              {t.resign}
            </button>
          </div>
        </div>
      </main>

      {/* Post-game Modal */}
      {gameStatus !== 'playing' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[16px] w-full max-w-[460px] overflow-hidden">
            
            {/* Header */}
            <div className="p-8 text-center border-b border-[#EBEBEA]">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4
                ${gameStatus === 'white_won' ? 'bg-green-100 text-green-600' : 
                  gameStatus === 'black_won' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}
              `}>
                {gameStatus === 'white_won' ? <Crown size={32} /> : 
                 gameStatus === 'black_won' ? <Flag size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <h2 className="text-[24px] font-bold mb-2">
                {gameStatus === 'white_won' ? t.youWon : 
                 gameStatus === 'black_won' ? t.aiWon : t.draw}
              </h2>
              <div className="flex justify-center gap-6 text-[14px] text-gray-500">
                <div><strong className="text-black">{Math.ceil(moveHistory.length / 2)}</strong> {t.moves}</div>
                <div><strong className="text-black">{formatTime(5 * 60 - whiteTime)}</strong> {t.time}</div>
              </div>
            </div>

            {/* Upsell Content */}
            <div className="p-8 bg-gray-50 text-center relative">
              <h3 className="text-[16px] font-semibold mb-2">{t.unlockAnalysis}</h3>
              <p className="text-[13px] text-gray-500 mb-6">{t.analysisSub}</p>

              <div className="relative h-[100px] mb-6 rounded-[8px] overflow-hidden border border-[#EBEBEA] bg-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZpbGw9IiNlN2U3ZTciIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiPjEyLiA8L3RleHQ+PC9zdmc+')] opacity-50"></div>
                <div className="absolute inset-0 backdrop-blur-[4px] bg-white/60 flex items-center justify-center">
                  <Lock className="text-gray-400" size={24} />
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    openAuthModal();
                  }}
                  className="w-full bg-black text-white py-3 rounded-[8px] text-[14px] font-semibold hover:bg-gray-800 transition-colors"
                >
                  {t.registerAnalysis}
                </button>
                <button 
                  onClick={() => {
                    setBoard(createInitialBoard());
                    setCurrentPlayer('white');
                    setGameStatus('playing');
                    setMoveHistory([]);
                    setWhiteTime(5 * 60);
                    setBlackTime(5 * 60);
                  }}
                  className="w-full bg-white text-black border border-[#EBEBEA] py-3 rounded-[8px] text-[14px] font-semibold hover:bg-gray-50 transition-colors"
                >
                  {t.playAgain}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SquareValue = "X" | "O" | null;
type Difficulty = "easy" | "medium" | "hard";

interface SquareProps {
    value: SquareValue;
    onSquareClick: () => void;
    winningSquare: boolean;
}

function Square({ value, onSquareClick, winningSquare }: SquareProps) {
    return (
        <motion.button
            className={`square flex items-center justify-center h-24 w-24 text-4xl font-bold border border-border rounded-lg 
        ${
            winningSquare
                ? "bg-primary text-primary-foreground"
                : "bg-card hover:bg-accent"
        }`}
            onClick={onSquareClick}
            whileHover={{ scale: value ? 1 : 1.05 }}
            whileTap={{ scale: value ? 1 : 0.95 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            disabled={!!value}
        >
            {value && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {value}
                </motion.span>
            )}
        </motion.button>
    );
}

export default function TicTacToe() {
    const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [status, setStatus] = useState("Your turn (X)");
    const [difficulty, setDifficulty] = useState<Difficulty>("medium");

    const winner = calculateWinner(squares);
    const winningLine = winner ? winner.line : [];

    // Handle player's move
    function handleClick(i: number) {
        if (gameOver || squares[i] || !isPlayerTurn) {
            return;
        }

        const newSquares = squares.slice();
        newSquares[i] = "X";
        setSquares(newSquares);
        setIsPlayerTurn(false);
    }

    // Computer's move
    useEffect(() => {
        if (!isPlayerTurn && !gameOver) {
            const timeoutId = setTimeout(() => {
                makeComputerMove();
            }, 500); // Slight delay for better UX

            return () => clearTimeout(timeoutId);
        }
    }, [isPlayerTurn, gameOver]);

    // Update game status
    useEffect(() => {
        if (winner) {
            setGameOver(true);
            setStatus(winner.player === "X" ? "You win!" : "Computer wins!");
        } else if (squares.every((square) => square !== null)) {
            setGameOver(true);
            setStatus("It's a draw!");
        } else {
            setStatus(
                isPlayerTurn ? "Your turn (X)" : "Computer's turn (O)..."
            );
        }
    }, [squares, isPlayerTurn, winner]);

    function makeComputerMove() {
        const newSquares = squares.slice();
        let move: number;

        switch (difficulty) {
            case "easy":
                move = makeEasyMove(newSquares);
                break;
            case "medium":
                move = makeMediumMove(newSquares);
                break;
            case "hard":
                move = makeHardMove(newSquares);
                break;
            default:
                move = makeMediumMove(newSquares);
        }

        if (move !== -1) {
            newSquares[move] = "O";
            setSquares(newSquares);
        }

        setIsPlayerTurn(true);
    }

    // Easy: 70% random moves, 30% strategic moves
    function makeEasyMove(board: SquareValue[]): number {
        // 30% chance to make a smart move
        if (Math.random() < 0.3) {
            // Try to win
            const winningMove = findWinningMove(board, "O");
            if (winningMove !== -1) return winningMove;

            // Block player from winning (50% chance)
            if (Math.random() < 0.5) {
                const blockingMove = findWinningMove(board, "X");
                if (blockingMove !== -1) return blockingMove;
            }
        }

        // Otherwise make a random move
        const availableMoves = board
            .map((square, i) => (square === null ? i : -1))
            .filter((i) => i !== -1);
        if (availableMoves.length > 0) {
            return availableMoves[
                Math.floor(Math.random() * availableMoves.length)
            ];
        }

        return -1;
    }

    // Medium: Strategic but not optimal
    function makeMediumMove(board: SquareValue[]): number {
        // Try to win
        const winningMove = findWinningMove(board, "O");
        if (winningMove !== -1) return winningMove;

        // Block player from winning
        const blockingMove = findWinningMove(board, "X");
        if (blockingMove !== -1) return blockingMove;

        // Take center if available
        if (board[4] === null) return 4;

        // Take a corner if available
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter((i) => board[i] === null);
        if (availableCorners.length > 0) {
            return availableCorners[
                Math.floor(Math.random() * availableCorners.length)
            ];
        }

        // Take any available space
        const availableMoves = board
            .map((square, i) => (square === null ? i : -1))
            .filter((i) => i !== -1);
        if (availableMoves.length > 0) {
            return availableMoves[
                Math.floor(Math.random() * availableMoves.length)
            ];
        }

        return -1;
    }

    // Hard: Minimax algorithm for optimal play
    function makeHardMove(board: SquareValue[]): number {
        // First move optimization: take center or corner
        const emptyCells = board.filter((cell) => cell === null).length;
        if (emptyCells === 9) {
            return 4; // Take center on first move
        }
        if (emptyCells === 8 && board[4] === "X") {
            // If player took center, take a corner
            return [0, 2, 6, 8][Math.floor(Math.random() * 4)];
        }

        // Use minimax for all other moves
        let bestScore = Number.NEGATIVE_INFINITY;
        let bestMove = -1;

        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = "O";
                const score = minimax(board, 0, false);
                board[i] = null;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    function minimax(
        board: SquareValue[],
        depth: number,
        isMaximizing: boolean
    ): number {
        // Check for terminal states
        const result = calculateWinner(board);
        if (result && result.player === "O") return 10 - depth;
        if (result && result.player === "X") return depth - 10;
        if (board.every((cell) => cell !== null)) return 0;

        if (isMaximizing) {
            let bestScore = Number.NEGATIVE_INFINITY;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === null) {
                    board[i] = "O";
                    const score = minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Number.POSITIVE_INFINITY;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === null) {
                    board[i] = "X";
                    const score = minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    function findWinningMove(board: SquareValue[], player: "X" | "O"): number {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8], // rows
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8], // columns
            [0, 4, 8],
            [2, 4, 6], // diagonals
        ];

        for (const line of lines) {
            const [a, b, c] = line;
            // Check if player can win in this line
            if (
                (board[a] === player &&
                    board[b] === player &&
                    board[c] === null) ||
                (board[a] === player &&
                    board[b] === null &&
                    board[c] === player) ||
                (board[a] === null &&
                    board[b] === player &&
                    board[c] === player)
            ) {
                // Return the empty position
                return board[a] === null ? a : board[b] === null ? b : c;
            }
        }

        return -1;
    }

    function resetGame() {
        setSquares(Array(9).fill(null));
        setIsPlayerTurn(true);
        setGameOver(false);
        setStatus("Your turn (X)");
    }

    function handleDifficultyChange(value: string) {
        setDifficulty(value as Difficulty);
        resetGame();
    }

    return (
        <Card className="w-full max-w-xl shadow-lg">
            <CardContent className="p-6">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex justify-between items-center w-full">
                        <h2 className="text-xl font-bold">{status}</h2>
                        <div className="flex items-center gap-2">
                            <Select
                                value={difficulty}
                                onValueChange={handleDifficultyChange}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={resetGame}
                                title="Reset game"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Square
                                key={i}
                                value={squares[i]}
                                onSquareClick={() => handleClick(i)}
                                winningSquare={winningLine.includes(i)}
                            />
                        ))}
                    </div>

                    {gameOver && (
                        <Button onClick={resetGame} className="mt-4" size="lg">
                            Play Again
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function calculateWinner(squares: SquareValue[]) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (
            squares[a] &&
            squares[a] === squares[b] &&
            squares[a] === squares[c]
        ) {
            return {
                player: squares[a],
                line: lines[i],
            };
        }
    }

    return null;
}

import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Returns the display string for player symbol.
 * @param {'X'|'O'|null} val
 */
function playerSymbol(val) {
  return val === "X" ? "❌" : val === "O" ? "⭕" : "";
}

// PUBLIC_INTERFACE
function App() {
  // Theme state for light/dark mode
  const [theme, setTheme] = useState("light");

  // Game state
  const [mode, setMode] = useState("two"); // "two" or "single"
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [status, setStatus] = useState(""); // "win", "tie", ""
  const [winner, setWinner] = useState(null); // "X", "O", or null
  const [gameStarted, setGameStarted] = useState(false);

  // Used in single player mode to determine computer side
  const [computerSide, setComputerSide] = useState("O");

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Handle computer move for single player mode
  useEffect(() => {
    if (
      mode === "single" &&
      gameStarted &&
      !status &&
      ((computerSide === "X" && xIsNext) ||
        (computerSide === "O" && !xIsNext))
    ) {
      // Delay for UX feel
      const timer = setTimeout(() => {
        const move = bestMove(board, computerSide); // MiniMax or Random fallback
        if (move !== -1) handleClick(move);
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [xIsNext, gameStarted, mode, status, computerSide]);

  // Detect win/tie after each move
  useEffect(() => {
    const res = calculateWinner(board);
    if (res) {
      setStatus("win");
      setWinner(res);
    } else if (board.every((sq) => sq)) {
      setStatus("tie");
      setWinner(null);
    } else {
      setStatus("");
      setWinner(null);
    }
  }, [board]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  function startNewGame(selectedMode, first = "X") {
    setMode(selectedMode);
    setBoard(Array(9).fill(null));
    setXIsNext(first === "X");
    setGameStarted(true);
    setStatus("");
    setWinner(null);
    setComputerSide(selectedMode === "single" ? (first === "X" ? "X" : "O") : "O");
  }

  // PUBLIC_INTERFACE
  function restartGame() {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setStatus("");
    setWinner(null);
    setGameStarted(true);
    if (mode === "single") setComputerSide(computerSide);
  }

  // PUBLIC_INTERFACE
  function handleClick(idx) {
    if (board[idx] || status) return;
    if (mode === "single") {
      // Only user can move their own side
      if (
        (computerSide === "X" && xIsNext) ||
        (computerSide === "O" && !xIsNext)
      )
        return;
    }
    const next = board.slice();
    next[idx] = xIsNext ? "X" : "O";
    setBoard(next);
    setXIsNext(!xIsNext);
  }

  // --- Game logic utils ---

  /**
   * Returns winner ("X" or "O") or null.
   * @param {string[]} squares
   */
  function calculateWinner(squares) {
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
    for (let [a, b, c] of lines) {
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  }

  /**
   * Get best move for AI using basic MiniMax (with fallback random when moves limited).
   * @param {*} curBoard
   * @param {*} computer
   */
  function bestMove(curBoard, computer) {
    // If board nearly empty, random move for speed
    if (curBoard.filter(Boolean).length < 2) {
      const empties = curBoard
        .map((v, i) => (v ? null : i))
        .filter((i) => i !== null);
      const idx = Math.floor(Math.random() * empties.length);
      return empties[idx];
    }
    let bestScore = -Infinity, move = -1;
    for (let i = 0; i < 9; ++i) {
      if (!curBoard[i]) {
        let temp = curBoard.slice();
        temp[i] = computer;
        let score = minimax(temp, 0, false, computer);
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  function minimax(b, depth, isMax, player) {
    let opp = player === "X" ? "O" : "X";
    let win = calculateWinner(b);
    if (win === player) return 10 - depth;
    if (win === opp) return depth - 10;
    if (b.every(Boolean)) return 0;

    let best = isMax ? -Infinity : Infinity;
    for (let i = 0; i < 9; ++i) {
      if (!b[i]) {
        b[i] = isMax ? player : opp;
        let val = minimax(b, depth + 1, !isMax, player);
        b[i] = null;
        if (isMax) best = Math.max(best, val);
        else best = Math.min(best, val);
      }
    }
    return best;
  }

  // --- UI/Render ---

  return (
    <div className="App">
      <header className="App-header" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {/* Theme switch */}
        <button className="theme-toggle" onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <h1 style={{
          margin: 0,
          fontWeight: 700,
          fontSize: '2.5rem',
          color: "var(--text-primary)",
          letterSpacing: "2px"
        }}>Tic Tac Toe</h1>
        <span style={{ color: "var(--text-secondary)", fontSize: "1.2rem", marginBottom: 10, marginTop: 5 }}>
          {mode === "two" ? "Two Player" : "Single Player vs Computer"}
        </span>
        {/* Game mode selection */}
        {!gameStarted && (
          <div style={{ margin: 32 }}>
            <button className="btn"
              style={btnStyle}
              onClick={() => startNewGame("single", "X")}
              data-testid="single-x"
            >
              Single Player (You: ❌)
            </button>
            <button className="btn"
              style={{ ...btnStyle, marginLeft: 14 }}
              onClick={() => startNewGame("single", "O")}
              data-testid="single-o"
            >
              Single Player (You: ⭕)
            </button>
            <button className="btn"
              style={{ ...btnStyle, marginLeft: 14 }}
              onClick={() => startNewGame("two")}
              data-testid="twoplayer"
            >
              Two Player
            </button>
            <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 10 }}>
              Choose mode to start
            </div>
          </div>
        )}
        {gameStarted && (
          <>
            {/* Player turn */}
            <div style={turnRowStyle}>
              <span style={{
                fontWeight: 600,
                color: status === "win" ? "var(--text-secondary)" : (xIsNext ? "#1976d2" : "#ff9800"),
                fontSize: "1.15rem"
              }}>
                {status === "win" ? (
                  <>
                    Winner: <span style={{ fontWeight: 800, fontSize: "1.45rem" }}>{playerSymbol(winner)}</span>
                  </>
                ) : status === "tie" ? "It's a tie!" : (
                  <>
                    Turn: <span style={{ fontWeight: 800, fontSize: "1.25rem" }}>{playerSymbol(xIsNext ? "X" : "O")}</span>
                  </>
                )}
              </span>
              <button className="btn" style={{ ...btnStyle, marginLeft: 22, padding: '7px 18px', background: "#f44336", color: "#fff"}}
                onClick={restartGame}
                aria-label="Restart Game"
                data-testid="restart"
              >
                Restart
              </button>
            </div>

            {/* Board */}
            <div
              className="tic-board"
              style={boardStyle}
              data-testid="ttt-board"
            >
              {board.map((val, idx) => (
                <button
                  key={idx}
                  style={{
                    ...cellStyle,
                    color:
                      val === "X"
                        ? "#1976d2"
                        : val === "O"
                        ? "#ff9800"
                        : "var(--text-primary)",
                    transition: "background 0.2s"
                  }}
                  className="tic-cell"
                  onClick={() => handleClick(idx)}
                  disabled={!!val || !!status}
                  aria-label={`cell-${idx}-${val || "empty"}`}
                  data-testid={`cell-${idx}`}
                >
                  <span style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                    {playerSymbol(val)}
                  </span>
                </button>
              ))}
            </div>

            {/* Info prompt */}
            {status && (
              <div
                style={{
                  marginTop: 20,
                  fontSize: 20,
                  fontWeight: 600,
                  color: winner
                    ? (winner === "X" ? "#1976d2" : "#ff9800")
                    : "var(--text-secondary)",
                  minHeight: 28
                }}
              >
                {status === "win"
                  ? `${playerSymbol(winner)} wins!`
                  : "Game ended in a tie."}
              </div>
            )}
            {/* Quit to home */}
            <button
              className="btn"
              style={{ ...btnStyle, marginTop: 32 }}
              onClick={() => setGameStarted(false)}
              data-testid="quit"
            >
              Quit
            </button>
          </>
        )}
        {/* Footer */}
        <footer
          style={{
            position: "fixed",
            bottom: 8,
            width: "100%",
            textAlign: "center",
            left: 0,
            fontSize: 13,
            color: "var(--text-secondary)"
          }}
        >
          Built with React | &copy; {new Date().getFullYear()}
        </footer>
      </header>
    </div>
  );
}

// Inline styles for board and cells (responsive and minimal)
const boardStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(70px, 1fr))",
  gridTemplateRows: "repeat(3, minmax(70px, 1fr))",
  gap: 6,
  margin: "30px auto 10px",
  width: 230,
  background: "var(--bg-primary)",
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(30,50,70,0.09)",
  maxWidth: "90vw"
};

const cellStyle = {
  background: "var(--bg-secondary)",
  border: "2px solid var(--border-color)",
  borderRadius: 8,
  width: "100%",
  height: "70px",
  fontSize: "2.1rem",
  fontWeight: 700,
  outline: "none",
  cursor: "pointer",
  transition: "background 0.18s, color 0.18s"
};

const btnStyle = {
  background: "#1976d2",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  padding: "8px 22px",
  margin: "5px 0",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 4px rgba(30,50,70,0.09)",
  transition: "background 0.2s"
};

const turnRowStyle = {
  marginTop: 22,
  marginBottom: -4,
  display: "flex",
  flexDirection: "row",
  alignItems: "center"
};

export default App;

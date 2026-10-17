package com.example.tictactoe.service;

import com.example.tictactoe.exception.CellOccupiedException;
import com.example.tictactoe.exception.GameOverException;
import com.example.tictactoe.exception.InvalidMoveException;
import com.example.tictactoe.model.GameState;
import com.example.tictactoe.model.GameStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Service holding and managing the core game state, rules, and scoring logic.
 * Acts as the single source of truth for the Tic-Tac-Toe application.
 */
@Service
public class GameService {

    private static final int BOARD_SIZE = 3;
    private static final String PLAYER_X = "X";
    private static final String PLAYER_O = "O";
    private static final String EMPTY = "";

    // 3x3 game board
    private final String[][] board = new String[BOARD_SIZE][BOARD_SIZE];

    // Current player turn ("X" or "O")
    private String currentPlayer;

    // Current game status
    private GameStatus status;

    // Winner ("X", "O", or null)
    private String winner;

    // Winning cell coordinates [[r1,c1], [r2,c2], [r3,c3]]
    private List<int[]> winningLine;

    // Status message for display
    private String message;

    // Scores
    private int scoreX;
    private int scoreO;
    private int draws;

    public GameService() {
        resetGame();
    }

    /**
     * Returns an immutable or detached snapshot of the current game state.
     */
    public synchronized GameState getGameState() {
        String[][] boardCopy = new String[BOARD_SIZE][BOARD_SIZE];
        for (int i = 0; i < BOARD_SIZE; i++) {
            boardCopy[i] = Arrays.copyOf(this.board[i], BOARD_SIZE);
        }

        List<int[]> lineCopy = null;
        if (this.winningLine != null) {
            lineCopy = new ArrayList<>();
            for (int[] coord : this.winningLine) {
                lineCopy.add(Arrays.copyOf(coord, coord.length));
            }
        }

        return new GameState(
                boardCopy,
                this.currentPlayer,
                this.status,
                this.winner,
                this.scoreX,
                this.scoreO,
                this.draws,
                lineCopy,
                this.message
        );
    }

    /**
     * Executes a move on the board for the current player.
     *
     * @param row row index (0-2)
     * @param col column index (0-2)
     * @return updated GameState
     */
    public synchronized GameState makeMove(int row, int col) {
        // 1. Validate boundary
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
            throw new InvalidMoveException("Invalid coordinates: row and col must be between 0 and " + (BOARD_SIZE - 1));
        }

        // 2. Validate game status
        if (this.status != GameStatus.IN_PROGRESS) {
            throw new GameOverException("Game is already over. Please start a new round or reset the game.");
        }

        // 3. Validate cell vacancy
        if (!EMPTY.equals(this.board[row][col])) {
            throw new CellOccupiedException(String.format("Cell at row %d, col %d is already occupied by '%s'.",
                    row, col, this.board[row][col]));
        }

        // 4. Place the player's symbol
        this.board[row][col] = this.currentPlayer;

        // 5. Check if the current move creates a win
        List<int[]> winCoords = checkWinCondition(this.currentPlayer);
        if (winCoords != null) {
            this.winningLine = winCoords;
            this.winner = this.currentPlayer;
            if (PLAYER_X.equals(this.currentPlayer)) {
                this.status = GameStatus.X_WON;
                this.scoreX++;
            } else {
                this.status = GameStatus.O_WON;
                this.scoreO++;
            }
            this.message = String.format("Player %s Wins!", this.winner);
            return getGameState();
        }

        // 6. Check if board is full (Draw)
        if (isBoardFull()) {
            this.status = GameStatus.DRAW;
            this.winner = null;
            this.winningLine = null;
            this.draws++;
            this.message = "It's a Draw!";
            return getGameState();
        }

        // 7. Alternate player turn
        this.currentPlayer = PLAYER_X.equals(this.currentPlayer) ? PLAYER_O : PLAYER_X;
        this.message = String.format("Player %s's Turn", this.currentPlayer);

        return getGameState();
    }

    /**
     * Starts a new round, preserving cumulative scores.
     */
    public synchronized GameState startNewRound() {
        clearBoard();
        this.currentPlayer = PLAYER_X;
        this.status = GameStatus.IN_PROGRESS;
        this.winner = null;
        this.winningLine = null;
        this.message = "Player X's Turn";
        return getGameState();
    }

    /**
     * Resets the entire game including scores back to zero.
     */
    public synchronized GameState resetGame() {
        this.scoreX = 0;
        this.scoreO = 0;
        this.draws = 0;
        return startNewRound();
    }

    /**
     * Clears all cells on the board.
     */
    private void clearBoard() {
        for (int r = 0; r < BOARD_SIZE; r++) {
            for (int c = 0; c < BOARD_SIZE; c++) {
                this.board[r][c] = EMPTY;
            }
        }
    }

    /**
     * Checks if all 9 cells are filled.
     */
    private boolean isBoardFull() {
        for (int r = 0; r < BOARD_SIZE; r++) {
            for (int c = 0; c < BOARD_SIZE; c++) {
                if (EMPTY.equals(this.board[r][c])) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Checks all 8 possible winning combinations for the given player symbol.
     *
     * @param symbol "X" or "O"
     * @return List of 3 coordinate pairs if won, otherwise null.
     */
    private List<int[]> checkWinCondition(String symbol) {
        // 1. Check Rows
        for (int r = 0; r < BOARD_SIZE; r++) {
            if (symbol.equals(board[r][0]) && symbol.equals(board[r][1]) && symbol.equals(board[r][2])) {
                List<int[]> line = new ArrayList<>();
                line.add(new int[]{r, 0});
                line.add(new int[]{r, 1});
                line.add(new int[]{r, 2});
                return line;
            }
        }

        // 2. Check Columns
        for (int c = 0; c < BOARD_SIZE; c++) {
            if (symbol.equals(board[0][c]) && symbol.equals(board[1][c]) && symbol.equals(board[2][c])) {
                List<int[]> line = new ArrayList<>();
                line.add(new int[]{0, c});
                line.add(new int[]{1, c});
                line.add(new int[]{2, c});
                return line;
            }
        }

        // 3. Check Main Diagonal (top-left to bottom-right)
        if (symbol.equals(board[0][0]) && symbol.equals(board[1][1]) && symbol.equals(board[2][2])) {
            List<int[]> line = new ArrayList<>();
            line.add(new int[]{0, 0});
            line.add(new int[]{1, 1});
            line.add(new int[]{2, 2});
            return line;
        }

        // 4. Check Anti-Diagonal (top-right to bottom-left)
        if (symbol.equals(board[0][2]) && symbol.equals(board[1][1]) && symbol.equals(board[2][0])) {
            List<int[]> line = new ArrayList<>();
            line.add(new int[]{0, 2});
            line.add(new int[]{1, 1});
            line.add(new int[]{2, 0});
            return line;
        }

        return null;
    }
}

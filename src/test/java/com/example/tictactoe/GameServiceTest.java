package com.example.tictactoe;

import com.example.tictactoe.exception.CellOccupiedException;
import com.example.tictactoe.exception.GameOverException;
import com.example.tictactoe.exception.InvalidMoveException;
import com.example.tictactoe.model.GameState;
import com.example.tictactoe.model.GameStatus;
import com.example.tictactoe.service.GameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("GameService Unit Tests")
class GameServiceTest {

    private GameService gameService;

    @BeforeEach
    void setUp() {
        gameService = new GameService();
    }

    @Test
    @DisplayName("Should execute valid X move as first turn")
    void testValidXMove() {
        GameState state = gameService.makeMove(0, 0);

        assertNotNull(state);
        assertEquals("X", state.getBoard()[0][0]);
        assertEquals("O", state.getCurrentPlayer());
        assertEquals(GameStatus.IN_PROGRESS, state.getStatus());
        assertEquals("Player O's Turn", state.getMessage());
    }

    @Test
    @DisplayName("Should execute valid O move after X move")
    void testValidOMove() {
        gameService.makeMove(0, 0); // X moves (0,0)
        GameState state = gameService.makeMove(1, 1); // O moves (1,1)

        assertEquals("O", state.getBoard()[1][1]);
        assertEquals("X", state.getCurrentPlayer());
        assertEquals(GameStatus.IN_PROGRESS, state.getStatus());
        assertEquals("Player X's Turn", state.getMessage());
    }

    @Test
    @DisplayName("Should reject move on an already occupied cell with CellOccupiedException")
    void testOccupiedCellMove() {
        gameService.makeMove(0, 0); // X takes (0,0)

        CellOccupiedException exception = assertThrows(CellOccupiedException.class, () -> {
            gameService.makeMove(0, 0); // O tries to take (0,0)
        });

        assertTrue(exception.getMessage().contains("already occupied"));
    }

    @Test
    @DisplayName("Should reject out-of-bounds row or column with InvalidMoveException")
    void testInvalidRowOrColumn() {
        assertThrows(InvalidMoveException.class, () -> gameService.makeMove(-1, 0));
        assertThrows(InvalidMoveException.class, () -> gameService.makeMove(0, 3));
        assertThrows(InvalidMoveException.class, () -> gameService.makeMove(3, 3));
    }

    @Test
    @DisplayName("Should detect winning row for Player X")
    void testWinningRow() {
        // X: (0,0), O: (1,0)
        // X: (0,1), O: (1,1)
        // X: (0,2) -> X wins row 0
        gameService.makeMove(0, 0); // X
        gameService.makeMove(1, 0); // O
        gameService.makeMove(0, 1); // X
        gameService.makeMove(1, 1); // O
        GameState state = gameService.makeMove(0, 2); // X

        assertEquals(GameStatus.X_WON, state.getStatus());
        assertEquals("X", state.getWinner());
        assertEquals(1, state.getScoreX());
        assertEquals(0, state.getScoreO());
        assertEquals("Player X Wins!", state.getMessage());
        assertNotNull(state.getWinningLine());
        assertEquals(3, state.getWinningLine().size());
    }

    @Test
    @DisplayName("Should detect winning column for Player O")
    void testWinningColumn() {
        // X: (0,0), O: (0,1)
        // X: (0,2), O: (1,1)
        // X: (2,0), O: (2,1) -> O wins col 1
        gameService.makeMove(0, 0); // X
        gameService.makeMove(0, 1); // O
        gameService.makeMove(0, 2); // X
        gameService.makeMove(1, 1); // O
        gameService.makeMove(2, 0); // X
        GameState state = gameService.makeMove(2, 1); // O

        assertEquals(GameStatus.O_WON, state.getStatus());
        assertEquals("O", state.getWinner());
        assertEquals(0, state.getScoreX());
        assertEquals(1, state.getScoreO());
        assertEquals("Player O Wins!", state.getMessage());
    }

    @Test
    @DisplayName("Should detect winning main diagonal for Player X")
    void testWinningDiagonal() {
        // X: (0,0), O: (0,1)
        // X: (1,1), O: (0,2)
        // X: (2,2) -> X wins diagonal
        gameService.makeMove(0, 0); // X
        gameService.makeMove(0, 1); // O
        gameService.makeMove(1, 1); // X
        gameService.makeMove(0, 2); // O
        GameState state = gameService.makeMove(2, 2); // X

        assertEquals(GameStatus.X_WON, state.getStatus());
        assertEquals("X", state.getWinner());
        assertEquals(1, state.getScoreX());
        assertEquals("Player X Wins!", state.getMessage());
    }

    @Test
    @DisplayName("Should detect winning anti-diagonal for Player X")
    void testWinningAntiDiagonal() {
        // X: (0,2), O: (0,0)
        // X: (1,1), O: (0,1)
        // X: (2,0) -> X wins anti-diagonal
        gameService.makeMove(0, 2); // X
        gameService.makeMove(0, 0); // O
        gameService.makeMove(1, 1); // X
        gameService.makeMove(0, 1); // O
        GameState state = gameService.makeMove(2, 0); // X

        assertEquals(GameStatus.X_WON, state.getStatus());
        assertEquals("X", state.getWinner());
        assertEquals(1, state.getScoreX());
        assertEquals("Player X Wins!", state.getMessage());
    }

    @Test
    @DisplayName("Should detect a draw when board is full with no winner")
    void testDraw() {
        /*
           Board layout for draw:
           X | O | X
           X | X | O
           O | X | O
        */
        gameService.makeMove(0, 0); // X
        gameService.makeMove(0, 1); // O
        gameService.makeMove(0, 2); // X
        gameService.makeMove(1, 2); // O
        gameService.makeMove(1, 0); // X
        gameService.makeMove(2, 0); // O
        gameService.makeMove(1, 1); // X
        gameService.makeMove(2, 2); // O
        GameState state = gameService.makeMove(2, 1); // X (final cell)

        assertEquals(GameStatus.DRAW, state.getStatus());
        assertNull(state.getWinner());
        assertEquals(1, state.getDraws());
        assertEquals("It's a Draw!", state.getMessage());
    }

    @Test
    @DisplayName("Should prevent moves after the game has ended")
    void testPreventMoveAfterGameEnds() {
        // Win the game for X
        gameService.makeMove(0, 0); // X
        gameService.makeMove(1, 0); // O
        gameService.makeMove(0, 1); // X
        gameService.makeMove(1, 1); // O
        gameService.makeMove(0, 2); // X wins

        // Attempt move after game over
        GameOverException exception = assertThrows(GameOverException.class, () -> {
            gameService.makeMove(2, 2);
        });

        assertTrue(exception.getMessage().contains("Game is already over"));
    }

    @Test
    @DisplayName("Should start new round preserving cumulative scores")
    void testStartNewRoundPreservesScores() {
        gameService.makeMove(0, 0); // X
        gameService.makeMove(1, 0); // O
        gameService.makeMove(0, 1); // X
        gameService.makeMove(1, 1); // O
        gameService.makeMove(0, 2); // X wins: scoreX=1

        GameState newRoundState = gameService.startNewRound();

        assertEquals(1, newRoundState.getScoreX());
        assertEquals(0, newRoundState.getScoreO());
        assertEquals(0, newRoundState.getDraws());
        assertEquals("X", newRoundState.getCurrentPlayer());
        assertEquals(GameStatus.IN_PROGRESS, newRoundState.getStatus());
        assertNull(newRoundState.getWinner());
        assertEquals("", newRoundState.getBoard()[0][0]);
    }

    @Test
    @DisplayName("Should reset entire game and all scores to zero")
    void testResetGameAndScores() {
        gameService.makeMove(0, 0); // X
        gameService.makeMove(1, 0); // O
        gameService.makeMove(0, 1); // X
        gameService.makeMove(1, 1); // O
        gameService.makeMove(0, 2); // X wins: scoreX=1

        GameState resetState = gameService.resetGame();

        assertEquals(0, resetState.getScoreX());
        assertEquals(0, resetState.getScoreO());
        assertEquals(0, resetState.getDraws());
        assertEquals("X", resetState.getCurrentPlayer());
        assertEquals(GameStatus.IN_PROGRESS, resetState.getStatus());
        assertEquals("", resetState.getBoard()[0][0]);
    }
}

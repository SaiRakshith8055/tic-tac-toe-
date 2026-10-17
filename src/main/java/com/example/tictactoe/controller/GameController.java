package com.example.tictactoe.controller;

import com.example.tictactoe.dto.MoveRequest;
import com.example.tictactoe.model.GameState;
import com.example.tictactoe.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller exposing game endpoints to the frontend.
 */
@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*") // Allows local development and testing from different origins
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    /**
     * Start a new game round while preserving session scores.
     * Endpoint: POST /api/game/start
     */
    @PostMapping("/start")
    public ResponseEntity<GameState> startGame() {
        GameState state = gameService.startNewRound();
        return ResponseEntity.ok(state);
    }

    /**
     * Fetch current state of the game.
     * Endpoint: GET /api/game/state
     */
    @GetMapping("/state")
    public ResponseEntity<GameState> getGameState() {
        GameState state = gameService.getGameState();
        return ResponseEntity.ok(state);
    }

    /**
     * Make a move on the board.
     * Endpoint: POST /api/game/move
     */
    @PostMapping("/move")
    public ResponseEntity<GameState> makeMove(@Valid @RequestBody MoveRequest moveRequest) {
        GameState state = gameService.makeMove(moveRequest.getRow(), moveRequest.getCol());
        return ResponseEntity.ok(state);
    }

    /**
     * Reset the game board. If query param resetScores=true, resets all scores to zero.
     * Endpoint: POST /api/game/reset?resetScores=false|true
     */
    @PostMapping("/reset")
    public ResponseEntity<GameState> resetGame(
            @RequestParam(name = "resetScores", required = false, defaultValue = "false") boolean resetScores) {
        GameState state;
        if (resetScores) {
            state = gameService.resetGame();
        } else {
            state = gameService.startNewRound();
        }
        return ResponseEntity.ok(state);
    }

    /**
     * Explicit endpoint to start a fresh round without clearing cumulative scores.
     * Endpoint: POST /api/game/new-round
     */
    @PostMapping("/new-round")
    public ResponseEntity<GameState> newRound() {
        GameState state = gameService.startNewRound();
        return ResponseEntity.ok(state);
    }
}

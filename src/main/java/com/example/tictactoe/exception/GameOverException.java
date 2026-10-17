package com.example.tictactoe.exception;

/**
 * Thrown when a player attempts to make a move after the game has already concluded.
 */
public class GameOverException extends RuntimeException {
    public GameOverException(String message) {
        super(message);
    }
}

package com.example.tictactoe.exception;

/**
 * Thrown when a move has invalid coordinates or violates game rules.
 */
public class InvalidMoveException extends RuntimeException {
    public InvalidMoveException(String message) {
        super(message);
    }
}

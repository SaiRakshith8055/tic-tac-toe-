package com.example.tictactoe.exception;

/**
 * Thrown when a player attempts to place a symbol in an already occupied cell.
 */
public class CellOccupiedException extends RuntimeException {
    public CellOccupiedException(String message) {
        super(message);
    }
}

package com.example.tictactoe.model;

import java.util.List;

/**
 * Model representing the complete state of the Tic-Tac-Toe game.
 */
public class GameState {

    private String[][] board;
    private String currentPlayer;
    private GameStatus status;
    private String winner;
    private int scoreX;
    private int scoreO;
    private int draws;
    private List<int[]> winningLine;
    private String message;

    public GameState() {
    }

    public GameState(String[][] board, String currentPlayer, GameStatus status, String winner,
                     int scoreX, int scoreO, int draws, List<int[]> winningLine, String message) {
        this.board = board;
        this.currentPlayer = currentPlayer;
        this.status = status;
        this.winner = winner;
        this.scoreX = scoreX;
        this.scoreO = scoreO;
        this.draws = draws;
        this.winningLine = winningLine;
        this.message = message;
    }

    public String[][] getBoard() {
        return board;
    }

    public void setBoard(String[][] board) {
        this.board = board;
    }

    public String getCurrentPlayer() {
        return currentPlayer;
    }

    public void setCurrentPlayer(String currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    public GameStatus getStatus() {
        return status;
    }

    public void setStatus(GameStatus status) {
        this.status = status;
    }

    public String getWinner() {
        return winner;
    }

    public void setWinner(String winner) {
        this.winner = winner;
    }

    public int getScoreX() {
        return scoreX;
    }

    public void setScoreX(int scoreX) {
        this.scoreX = scoreX;
    }

    public int getScoreO() {
        return scoreO;
    }

    public void setScoreO(int scoreO) {
        this.scoreO = scoreO;
    }

    public int getDraws() {
        return draws;
    }

    public void setDraws(int draws) {
        this.draws = draws;
    }

    public List<int[]> getWinningLine() {
        return winningLine;
    }

    public void setWinningLine(List<int[]> winningLine) {
        this.winningLine = winningLine;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

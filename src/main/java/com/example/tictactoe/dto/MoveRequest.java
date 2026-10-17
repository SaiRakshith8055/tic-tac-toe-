package com.example.tictactoe.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Data Transfer Object for move requests submitted by players.
 */
public class MoveRequest {

    @NotNull(message = "Row must not be null")
    @Min(value = 0, message = "Row index must be between 0 and 2")
    @Max(value = 2, message = "Row index must be between 0 and 2")
    private Integer row;

    @NotNull(message = "Column must not be null")
    @Min(value = 0, message = "Column index must be between 0 and 2")
    @Max(value = 2, message = "Column index must be between 0 and 2")
    private Integer col;

    public MoveRequest() {
    }

    public MoveRequest(Integer row, Integer col) {
        this.row = row;
        this.col = col;
    }

    public Integer getRow() {
        return row;
    }

    public void setRow(Integer row) {
        this.row = row;
    }

    public Integer getCol() {
        return col;
    }

    public void setCol(Integer col) {
        this.col = col;
    }
}

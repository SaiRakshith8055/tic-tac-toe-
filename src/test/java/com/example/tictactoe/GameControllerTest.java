package com.example.tictactoe;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("GameController REST API Integration Tests")
class GameControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        // Reset game before each test
        mockMvc.perform(post("/api/game/reset?resetScores=true"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/game/state returns initial game state")
    void testGetInitialGameState() throws Exception {
        mockMvc.perform(get("/api/game/state"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPlayer").value("X"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.scoreX").value(0))
                .andExpect(jsonPath("$.scoreO").value(0))
                .andExpect(jsonPath("$.draws").value(0))
                .andExpect(jsonPath("$.board", hasSize(3)));
    }

    @Test
    @DisplayName("POST /api/game/move with valid move returns 200 OK")
    void testValidMove() throws Exception {
        String moveJson = "{\"row\": 0, \"col\": 0}";

        mockMvc.perform(post("/api/game/move")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(moveJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.board[0][0]").value("X"))
                .andExpect(jsonPath("$.currentPlayer").value("O"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("POST /api/game/move on occupied cell returns 409 Conflict")
    void testMoveOnOccupiedCell() throws Exception {
        String moveJson = "{\"row\": 1, \"col\": 1}";

        // First move takes (1,1)
        mockMvc.perform(post("/api/game/move")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(moveJson))
                .andExpect(status().isOk());

        // Second move on (1,1) returns 409 Conflict
        mockMvc.perform(post("/api/game/move")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(moveJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("already occupied")));
    }

    @Test
    @DisplayName("POST /api/game/move with out-of-range coordinates returns 400 Bad Request")
    void testInvalidMoveBounds() throws Exception {
        String invalidJson = "{\"row\": 5, \"col\": 0}";

        mockMvc.perform(post("/api/game/move")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("POST /api/game/move with null values returns 400 Bad Request")
    void testNullMove() throws Exception {
        String nullJson = "{\"row\": null, \"col\": 0}";

        mockMvc.perform(post("/api/game/move")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nullJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("POST /api/game/start starts fresh round")
    void testStartGame() throws Exception {
        mockMvc.perform(post("/api/game/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentPlayer").value("X"))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("POST /api/game/reset resets round or scores")
    void testResetGame() throws Exception {
        mockMvc.perform(post("/api/game/reset?resetScores=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scoreX").value(0))
                .andExpect(jsonPath("$.scoreO").value(0))
                .andExpect(jsonPath("$.draws").value(0));
    }
}

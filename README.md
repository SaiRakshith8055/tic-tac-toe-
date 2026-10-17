# 🎮 2-Player Tic-Tac-Toe Web Application

> **"Two Players. One Winner."**  
> A stylish, modern, full-stack 2-player Tic-Tac-Toe web application built with **Java Spring Boot** on the backend and **HTML5, CSS3, & Vanilla JavaScript** on the frontend. Designed as a polished college mini-project demonstration.

---

## 📌 1. Project Overview

This project is a classic **Tic-Tac-Toe game for two players** sharing the same screen/device.
- **Player 1** plays as **X** (Electric Cyan neon).
- **Player 2** plays as **O** (Vibrant Pink neon).
- **The Java Spring Boot backend acts as the single source of truth** for all game rules, move validations, win detection (all 8 combinations), draw detection, and score tracking.
- The frontend is an interactive, responsive dark-mode web interface communicating with the backend purely via **JSON REST APIs**.

---

## ✨ 2. Key Features

- **Strict Client-Server Architecture:** The frontend never decides winners or validates moves locally. Every move is sent to Java via REST API.
- **Complete Game Rule Validation:**
  - Alternating turns (X always moves first).
  - Validation of row & col coordinates (0 to 2).
  - Prevention of cell overwriting (returns HTTP 409 Conflict).
  - Prevention of moves after game conclusion (returns HTTP 409 Conflict).
  - Automatic detection of all 8 winning lines (3 horizontal rows, 3 vertical columns, 2 diagonals).
  - Automatic draw detection when all 9 cells are filled with no winner.
- **Scoreboard & Game Controls:**
  - Displays real-time scores for Player X, Player O, and total Draws.
  - **"New Game" Button:** Resets the board for a fresh round while preserving cumulative scores.
  - **"Reset Game" Button:** Resets the board and resets all scores back to zero.
- **Modern UI & Aesthetic Polish:**
  - Ambient deep purple & blue neon gradient background with floating glowing orbs.
  - Glassmorphic translucent cards with glowing borders.
  - Animated turn indicator badge with live active pulse.
  - Glowing highlight on winning cell lines.
  - Celebratory confetti particle explosion on victory.
  - Web Audio API sound effects for moves, wins, draws, and warnings (zero external audio file dependencies).
  - Error banner notification with smooth dismiss animation.
  - Fully responsive across mobile, tablet, and desktop screens.

---

## 🛠️ 3. Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Java 17+ (SE 17 / 21 / 25 / 27) | Object-oriented core game engine |
| **Framework** | Spring Boot 3.3.4 | REST Controller, Exception Handling, Static Resource hosting |
| **Build Tool** | Apache Maven | Project build, dependency management, and automated test runner |
| **Frontend UI** | HTML5, CSS3, JavaScript (ES6+) | Vanilla client interacting via `fetch()` REST calls |
| **API Format** | JSON (REST API) | Request/Response communication format |
| **Testing** | JUnit 5 & Spring MockMvc | Unit and integration tests |

---

## 📂 4. Project Directory Structure

```
TIC TAC TOE(2PLAYERS)/
├── pom.xml                                      # Maven dependencies and build configuration
├── README.md                                    # Documentation and execution guide
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/example/tictactoe/
    │   │       ├── TicTacToeApplication.java    # Spring Boot Main Entry Point
    │   │       ├── controller/
    │   │       │   └── GameController.java      # REST API Endpoints (/api/game/*)
    │   │       ├── service/
    │   │       │   └── GameService.java         # Board logic, rules, win check & scores
    │   │       ├── model/
    │   │       │   ├── GameState.java           # Complete game state model
    │   │       │   └── GameStatus.java          # IN_PROGRESS, X_WON, O_WON, DRAW enum
    │   │       ├── dto/
    │   │       │   ├── MoveRequest.java         # Move payload DTO (row, col)
    │   │       │   └── ErrorResponse.java       # Standard error format DTO
    │   │       └── exception/
    │   │           ├── InvalidMoveException.java# HTTP 400 Out of bounds exception
    │   │           ├── CellOccupiedException.java# HTTP 409 Cell already taken exception
    │   │           ├── GameOverException.java   # HTTP 409 Move after win/draw exception
    │   │           └── GlobalExceptionHandler.java# Centralized exception handler
    │   └── resources/
    │       ├── application.properties           # Spring server configuration (port 8080)
    │       └── static/                          # Frontend Static Web Assets
    │           ├── index.html                   # Semantic HTML5 layout
    │           ├── style.css                    # Modern CSS3 dark-theme design
    │           └── script.js                    # JavaScript REST API consumer & UI engine
    └── test/
        └── java/
            └── com/example/tictactoe/
                ├── GameServiceTest.java         # 12 Unit tests for game logic
                └── GameControllerTest.java      # 7 Integration tests with MockMvc
```

---

## ⚙️ 5. Prerequisites

Before running the application, ensure you have:
1. **JDK 17 or later** installed.
   - Verify by running:
     ```bash
     java -version
     ```
2. **Apache Maven 3.8+** installed.
   - Verify by running:
     ```bash
     mvn -version
     ```
3. (Optional) **Visual Studio Code** with the *Extension Pack for Java*.

---

## 🚀 6. Instructions to Open & Run in VS Code

### Step 1: Open Folder in VS Code
1. Launch **Visual Studio Code**.
2. Select **File > Open Folder...** (or press `Cmd+O` on macOS / `Ctrl+O` on Windows).
3. Navigate to and select the folder:
   ```
   /Users/rakshithyama8055/Desktop/TIC TAC TOE(2PLAYERS)
   ```
4. If prompted with *"Do you trust the authors of the files in this folder?"*, click **Yes, I trust the authors**.

### Step 2: Run via Terminal in VS Code
Open the integrated terminal in VS Code (`Ctrl + ~` or **Terminal > New Terminal**) and execute:

```bash
mvn spring-boot:run
```

Once you see:
```text
Tomcat started on port 8080 (http) with context path '/'
Started TicTacToeApplication in ... seconds
```

### Step 3: Open in Browser
Open your preferred web browser (Chrome, Edge, Safari, Firefox) and navigate to:
```
http://localhost:8080
```

---

## 📡 7. REST API Documentation

| Method | Endpoint | Description | Request Body | Response Codes |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/game/state` | Returns the current board, turn, winner, and scores | *None* | `200 OK` |
| **POST** | `/api/game/move` | Makes a move at `(row, col)` for current player | `{"row": 0, "col": 0}` | `200 OK`, `400 Bad Request`, `409 Conflict` |
| **POST** | `/api/game/start` | Starts fresh round preserving cumulative scores | *None* | `200 OK` |
| **POST** | `/api/game/new-round`| Starts fresh round preserving cumulative scores | *None* | `200 OK` |
| **POST** | `/api/game/reset` | Resets board. Pass `?resetScores=true` to wipe scores to 0 | *None* (query param) | `200 OK` |

### Sample Move Request Payload:
```json
{
  "row": 1,
  "col": 2
}
```

### Sample GameState JSON Response:
```json
{
  "board": [
    ["X", "O", "X"],
    ["",  "X", ""],
    ["O", "",  ""]
  ],
  "currentPlayer": "O",
  "status": "IN_PROGRESS",
  "winner": null,
  "scoreX": 2,
  "scoreO": 1,
  "draws": 0,
  "winningLine": null,
  "message": "Player O's Turn"
}
```

### Sample Error Response (e.g. Occupied Cell or Game Over):
```json
{
  "timestamp": "2026-10-17T09:53:53.905609",
  "status": 409,
  "error": "Conflict",
  "message": "Cell at row 0, col 0 is already occupied by 'X'.",
  "path": "/api/game/move"
}
```

---

## 🧪 8. Automated Testing

The project includes **19 automated JUnit 5 & MockMvc tests** verifying:
- Valid `X` move and turn alternation.
- Valid `O` move.
- Rejection of moves on occupied cells (`409 Conflict`).
- Rejection of out-of-bounds rows or columns (`400 Bad Request`).
- Rejection of null/malformed JSON payloads.
- Row win conditions (all 3 horizontal lines).
- Column win conditions (all 3 vertical lines).
- Diagonal and anti-diagonal win conditions.
- Full board draw condition without winner.
- Prevention of moves after game conclusion (`409 Conflict`).
- Preservation of scores on new round.
- Resetting of all scores to zero.

To execute all tests from the terminal:
```bash
mvn clean test
```

Expected result:
```
[INFO] Results:
[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 🔧 9. Troubleshooting Tips

1. **Port 8080 is already in use (`Address already in use`):**
   - Check what process is using port 8080:
     ```bash
     lsof -i :8080
     ```
   - Terminate the conflicting process:
     ```bash
     kill -9 <PID>
     ```
   - Or change the port in `src/main/resources/application.properties`:
     ```properties
     server.port=8081
     ```

2. **Java Version Mismatch:**
   - Ensure `java -version` returns JDK 17 or higher.
   - If using VS Code, set your Java runtime in Settings to Java 17+.

3. **Maven command not recognized (`mvn: command not found`):**
   - Install Maven via Homebrew on macOS: `brew install maven`, or use `./mvnw` if a Maven wrapper is generated.

---

## 🎓 10. College Demonstration Guide

When presenting this project to your faculty, demonstrate the following key points:
1. **Explain the Architecture:** State that the browser serves as a pure presentation layer, while Spring Boot handles business logic, state synchronization, and validations.
2. **Demonstrate RESTful Communication:** Open Developer Tools (`F12` > Network tab) and show the JSON request sent when clicking a cell, and the JSON state returned by Java.
3. **Show Error Handling:** Try clicking an already filled cell and show the friendly UI notification generated from the HTTP 409 Conflict response.
4. **Demonstrate Win Detection & Confetti:** Win a game with 3-in-a-row to showcase winning line glow, score incrementing, and celebratory confetti.
5. **Demonstrate Score Preservation vs Total Reset:** Click "New Game" to show scores preserved across rounds, then click "Reset Game" to show scores cleared back to zero.

# Game Algorithms and Win Rate Mechanics

This document explains the algorithms, mechanics, and win-rate restrictions applied to the live results and the guess-matching game in this application.

## 1. Early Morning Result Timing (6:00 AM - 7:00 AM)
Live results for the current day are scheduled to display or update strictly during the early morning hours:
* **Time window**: 6:00 AM to 7:00 AM local time.
* **Behavior**: Before 6:00 AM, results show as "Pending" or "Scheduled". Between 6:00 AM and 7:00 AM, results are actively published with a flashing "LIVE" indicator showing they were updated recently. After 7:00 AM, they remain visible as the day's final result.

---

## 2. The 1/120 Win-Limitation Algorithm
To maintain strict platform economics, the application guarantees that **only 1 out of every 120 guess attempts can result in a match (win)**.

### Mathematical Condition
Let $C$ be the global counter of guess attempts, resetting every 120 attempts:
$$C \in [0, 119]$$

1. Upon startup, the system selects a secret random winning index $W \in [0, 119]$.
2. For each incoming guess:
   - Increment $C$.
   - If $C \pmod{120} == W$:
     - This is the designated "Win Attempt". The system checks if the user's guessed number matches the predefined winning number. If yes, they win! If not, they still lose.
   - If $C \pmod{120} \neq W$:
     - This is a "Force Lose Attempt". Even if the user's guessed number matches the real secret winning number, the system will **dynamically swap** or return a mismatch response, informing them that their number did not match.

### Anti-Matching Logic (Dynamic Mismatch Generation)
To ensure the user never suspects the game is rigged, when a user makes a guess under the "Force Lose Attempt" condition, the system:
1. Compares their guessed number $G$ with the target secret number $T$.
2. If $G == T$:
   - The system dynamically generates an alternative display number $D \neq G$ (e.g., $D = (G + 1) \pmod{100}$).
   - The system displays $D$ as the "Result" for their check, showing a mismatch: *"Your Guess: G, Winning Number: D (No Match)"*.

---

## 3. Administrative Overrides
Admin rules can bypass the $1/120$ logic for specific user IDs:
* **Force Always Win**: If a user is marked with `override: "WIN"`, their guess will always match the target secret number, regardless of the $1/120$ counter.
* **Force Always Lose**: If a user is marked with `override: "LOSE"`, their guess will always be forced to result in a mismatch, even on the designated winning index.

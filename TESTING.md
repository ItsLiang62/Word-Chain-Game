# Testing Guide

## Setup
Make sure both backend and frontend are running locally before testing.
If causing confusion, set `reactStrictMode: false` in `next.config.js` to avoid duplicate display (e.g. in game history) during testing.

## Authentication
- [✅] Visiting /game or /history or /stats directly without logging in redirects to home page
- [✅] Entering a username saves it to localStorage and redirects to game page

## Game
- [✅] Starting a game displays the AI's first word
- [✅] Submitting a word that does not start with the correct letter is rejected
- [✅] Submitting a repeated word is rejected
- [✅] Submitting a nonsense word is rejected
- [✅] A valid uncommon word shows "Creative word!" message
- [✅] Score increases after each valid word
- [✅] Creativity streak increments on consecutive creative words
- [✅] Round counter does not exceed 10
- [✅] Winning all 10 rounds shows "You win!" banner
- [✅] Submitting an invalid word ends the game with "Game lost" banner
- [✅] Starting a new game resets all state

## Difficulty
- [✅] Easy mode — AI words are 4 to 6 letters
- [✅] Medium mode — AI words are 6 to 8 letters
- [✅] Hard mode — AI words are 8 to 12 letters and do not end in S

## History
- [✅] Completed games appear in game history
- [✅] Each record shows correct difficulty, score, rounds, outcome and timestamp
- [✅] No history shows "No game history found" message

## Statistics
- [✅] Total games increments after each completed game
- [✅] Best score updates when a new high score is achieved
- [✅] Average score is correct across multiple games
- [✅] Wins by difficulty shows correct counts per difficulty
- [✅] Win streak increments on consecutive wins

## Rules Modal
- [✅] Rules button appears during an active game
- [✅] Clicking Rules opens the modal
- [✅] Clicking Got it closes the modal
# Design Decisions

## Why LangGraph

LangGraph was chosen over a simple loop or plain LangChain chain because the game has branching logic that is difficult to express linearly:

- The agent word can be rejected and retried indefinitely
- The player word can be rejected and the game ends immediately
- The game can terminate at two different points in the flow (round limit or invalid player word)

LangGraph lets each of these be expressed as a node with conditional edges, making the control flow explicit and easy to follow. The built-in checkpointer (MemorySaver) also handles game state persistence across HTTP requests without needing a separate session store, which simplifies the backend significantly.

## ChainSession Design

ChainSession is a TypedDict that acts as the single source of truth for a game. It holds:

- `game_id` — unique identifier, used as the LangGraph thread_id so each game has isolated state
- `username` — links the session to a player for stat tracking
- `difficulty` — determines word length and complexity constraints for the agent
- `current_round` — incremented at the start of each round, used to detect game completion
- `used_words` — append-only list of all words played, used for duplicate detection and last-letter chaining
- `last_letter` — derived from the last accepted word, passed as constraint to the next word generator
- `cascade_streak` — tracks consecutive uncommon words for score multiplier (see below)
- `total_score` — accumulates across rounds
- `game_status` — either "active" or "completed", used by the frontend to trigger end state

The design keeps all mutable state in one flat dict rather than nested objects so LangGraph can diff and checkpoint it cleanly.

## Cascade Streak and Scoring

Base score per round is 10 points.

If the player's word is judged "uncommon" by the LLM:
- +5 bonus points
- cascade_streak increments
- If cascade_streak >= 3 (three or more consecutive uncommon words):
  - Score is doubled
  - +1 point per letter beyond 5 (rewards longer uncommon words)

If the word is "common", cascade_streak resets to 0.

The cascade mechanic rewards players who consistently use creative or rare vocabulary. A single uncommon word gives a small bonus, but chaining them together gives exponentially better scores, encouraging aggressive vocabulary choices.

## Win / Loss Definition

A game is a **win** if the player survives all 10 rounds — meaning they successfully submit a valid word in each of rounds 1 through 10. `current_round` reaches 11 after `new_round` increments post round 10, which triggers the `completed` node via `check_completed`.

A game is a **loss** if the player submits an invalid word at any point. Invalid means:
- Word does not start with the required letter
- Word has already been used
- Word contains non-alphabetic characters
- Word is judged not a real word by the LLM

On a loss, the graph routes `clear_player_word` → `completed` → END immediately, cutting the round short. The outcome column in the Games table is a computed default in Supabase defined as (rounds_completed = 10) and is never explicitly set by the backend.
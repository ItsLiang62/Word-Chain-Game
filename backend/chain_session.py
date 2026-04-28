from typing import TypedDict, Literal

class ChainSession(TypedDict):
    game_id: str
    difficulty: Literal["easy", "medium", "hard"]
    current_round: int
    used_words: list[str]
    cascade_streak: int
    username: str
    total_score: int
    last_letter: str
    game_status: Literal["active", "completed", "forfeit"]
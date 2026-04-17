from logic import build_graph
from db_helper import *
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

graph = build_graph(ChainSession)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://word-chain-game-kappa.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/start")
def start(game_id, difficulty, username):
    session: ChainSession = {
        "game_id": game_id,
        "difficulty": difficulty,
        "current_round": 0,
        "used_words": [],
        "cascade_streak": 0,
        "username": username,
        "total_score": 0,
        "last_letter": "",
        "game_status": "active"
    }
    config = {"configurable": {"thread_id": game_id}}

    events = graph.stream(session, config)

    for event in events:
        pass

    values = graph.get_state(config).values
    return {
        "agent_word": values["used_words"][-1],
        "current_round": values["current_round"]
    }

@app.post("/submit_word")
def submit_word(word, game_id):
    config = {"configurable": {"thread_id": game_id}}
    current_state = graph.get_state(config)

    if not current_state.next:
        return {"error": "game already completed"}

    updated_used_words = current_state.values["used_words"] + [word]
    graph.update_state(config, {"used_words": updated_used_words}, as_node="player_word")

    events = graph.stream(None, config)

    for event in events:
        pass

    values = graph.get_state(config).values

    if values["game_status"] == "completed":
        save_completed_session(values)

    return {
        "agent_word": values["used_words"][-1],
        "current_round": values["current_round"],
        "cascade_streak": values["cascade_streak"],
        "total_score": values["total_score"],
        "game_status": values["game_status"]
    }

@app.post("/game_info")
def game_info(game_id):
    config = {"configurable": {"thread_id": game_id}}
    values = graph.get_state(config).values

    return {
        "game_id": values["game_id"],
        "difficulty": values["difficulty"],
        "username": values["username"]
    }

@app.post("/game_history")
def game_history(username: str):
    return StreamingResponse(gen_completed_session(username), media_type="text/event-stream")

@app.post("/player_stats")
def game_stats(username: str):
    return get_statistics(username)
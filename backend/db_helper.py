import os
import json
from supabase import create_client, Client
from datetime import datetime
from chain_session import ChainSession
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def save_completed_session(session: ChainSession):
    if session["game_status"] == "completed":
        select_player_stats_response = supabase.table("Player Stats").select("*").eq("username", session["username"]).execute()

        if select_player_stats_response.data: # if player exists
            
            # update player stats
            row = select_player_stats_response.data[0]
            total_games = row["total_games"] + 1
            best_score = max(session["total_score"], row["best_score"])
            average_score = (row["total_games"] * row["average_score"] + session["total_score"]) / total_games
            total_wins = row["total_wins"]
            wins_by_difficulty = row["wins_by_difficulty"]
            current_streak = 0

            # update win-related stats if win
            if session["current_round"] > 10:
                total_wins += 1
                wins_by_difficulty[session["difficulty"]] += 1
                current_streak = row["current_streak"] + 1

            # overwrite player stats
            supabase.table("Player Stats").upsert({
                "username": session["username"],
                "total_games": total_games,
                "best_score": best_score,
                "average_score": average_score,
                "total_wins": total_wins,
                "wins_by_difficulty": wins_by_difficulty,
                "current_streak": current_streak,
            }).execute()
        else: # if player doesn't exist
            total_wins = 0
            wins_by_difficulty = {
                "easy": 0,
                "medium": 0,
                "hard": 0,
            }
            current_streak = 0

            # Update win-related stats if win
            if session["current_round"] > 10:
                total_wins = 1
                wins_by_difficulty[session["difficulty"]] = 1
                current_streak = 1

            supabase.table("Player Stats").insert({
                "username": session["username"],
                "total_games": 1,
                "best_score": session["total_score"],
                "average_score": session["total_score"],
                "total_wins": total_wins,
                "wins_by_difficulty": wins_by_difficulty,
                "current_streak": current_streak
            }).execute()

        supabase.table("Games").insert({
            "game_id": session["game_id"],
            "username": session["username"],
            "difficulty": session["difficulty"],
            "final_score": session["total_score"],
            "rounds_completed": session["current_round"] - 1,
        }).execute()

        return True
    return False

# generator for completed games for memory efficiency
def gen_completed_session(username):
    select_games_response = supabase.table("Games").select("*").eq("username", username).execute()

    if select_games_response.data: # If player has completed games
        for row in select_games_response.data:
            data = json.dumps({
                "game_id": row["game_id"],
                "username": row["username"],
                "difficulty": row["difficulty"],
                "final_score": row["final_score"],
                "rounds_completed": row["rounds_completed"],
                "outcome": "Win" if row["outcome"] else "Loss",
                "timestamp": datetime.fromisoformat(row["timestamp"]).strftime("%d %B %Y - %I:%M %p"),
            })
            yield f"{data}\n"
    else: # if player has no completed games
        yield "null\n"

def get_statistics(username):
    select_player_stats_response = supabase.table("Player Stats").select("*").eq("username", username).execute()

    if select_player_stats_response.data:
        row = select_player_stats_response.data[0]
        return {
            "username": row["username"],
            "total_games": row["total_games"],
            "best_score": row["best_score"],
            "average_score": row["average_score"],
            "total_wins": row["total_wins"],
            "wins_by_difficulty": row["wins_by_difficulty"],
            "current_streak": row["current_streak"]
        }
    return None
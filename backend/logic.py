import re
import os
import time
import groq
import logging
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from groq import Groq
from groq.types.chat import ChatCompletionUserMessageParam
from dotenv import load_dotenv

load_dotenv()
memory = MemorySaver()
client = Groq(api_key=os.environ["GROQ_API_KEY"])
logger = logging.getLogger(__name__)

def generate(user_content):

    messages: list[ChatCompletionUserMessageParam] = [
        {
            "role": "user",
            "content": user_content
        }
    ]

    while True:
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                temperature=0.9,
                top_p=0.9
            )

            match = re.search(r'[a-zA-Z]+', response.choices[0].message.content)
            word = match.group(0) if match else ""
            return word.lower().strip()
        except groq.RateLimitError as e:
            match = re.search(r'try again in (\d+)s', str(e))
            wait = int(match.group(1)) + 1 if match else 5
            logger.warning(f"Rate limit hit, waiting {wait} seconds...")
            time.sleep(wait)
        except Exception as e:
            logger.error(f"Groq error: {e}")
            time.sleep(3)

def valid_word(state, agent_word=False):
    word = state["used_words"][-1]
    if not word.isalpha() or word in state["used_words"][:-1]:
        return False
    if state["last_letter"] and not word.startswith(state["last_letter"]):
        return False

    if agent_word:
        difficulty = state["difficulty"]
        if difficulty == "easy" and not 4 <= len(word) <= 6:
            return False
        if difficulty == "medium" and not 6 <= len(word) <= 8:
            return False
        if difficulty == "hard" and (not 8 <= len(word) <= 12 or word.lower().endswith("s")):
            return False
        return True
    return True

def new_round(state):
    return {"current_round": state["current_round"] + 1}

def check_completed(state):
    if state["current_round"] > 10:
        return "completed"
    else:
        return "get_agent_word"

def completed(state):
    return {"game_status": "completed"}

def get_agent_word(state):
    word_notes = {
        "easy": "common everyday",
        "medium": "interesting but well-known",
        "hard": "uncommon",
    }

    letter_count = {
        "easy": "4 to 6",
        "medium": "6 to 8",
        "hard": "8 to 12"
    }

    difficulty = state["difficulty"]

    if state["last_letter"] == "":
        system_content = f"""
        You are generating a word.
        Respond with ONLY one random {word_notes[difficulty]} word that contains {letter_count[difficulty]} letters."
        Answer:
        """
    else:
        system_content = f"""
        You are generating a word.
        Respond with ONLY one {word_notes[difficulty]} word starting with the letter \"{state["last_letter"]}\" that contains {letter_count[difficulty]} letters.
        Answer:
        """

    output = generate(system_content)

    used_words = state["used_words"] + [output]

    return {"used_words": used_words}

def check_agent_word(state):
    if not valid_word(state, agent_word=True):
        return "clear_agent_word"
    return "update_agent_last_letter"

def clear_agent_word(state):
    return {"used_words": state["used_words"][:-1]}

def update_agent_last_letter(state):
    return {"last_letter": state["used_words"][-1][-1].lower()}

def player_word(state):
    return {}

def check_player_word(state):
    if not valid_word(state):
        return "clear_player_word"

    word = state["used_words"][-1]
    system_content = f"""
    You are evaluating word validity.
    Respond with ONLY one word: valid or invalid.
    Word: {word}
    Answer:
    """

    output = ""
    while output not in {"valid", "invalid"}:
        output = generate(system_content)

    if output == "invalid":
        return "clear_player_word"
    return "update_player_last_letter"

def clear_player_word(state):
    return {"used_words": state["used_words"][:-1]}

def update_player_last_letter(state):
    return {"last_letter": state["used_words"][-1][-1].lower()}

def update_score(state):
    word = state["used_words"][-1]
    cascade_streak = state["cascade_streak"]
    total_score = state["total_score"]

    system_content = f"""
    You are evaluating word creativity.
    Respond with ONLY one word: common or uncommon.
    Word: "{word}"
    Answer:
    """

    output = ""
    while output not in {"common", "uncommon"}:
        output = generate(system_content)

    score = 10

    if output == "uncommon":
        score += 5
        if cascade_streak >= 2:
            score *= 2
            score += max(len(word) - 5, 0)
        cascade_streak += 1
    else:
        cascade_streak = 0

    total_score += score

    return {"total_score": total_score, "cascade_streak": cascade_streak}

def build_graph(state_type):
    builder = StateGraph(state_type)
    builder.add_node("new_round", new_round)
    builder.add_node("completed", completed)
    builder.add_node("get_agent_word", get_agent_word)
    builder.add_node("clear_agent_word", clear_agent_word)
    builder.add_node("update_agent_last_letter", update_agent_last_letter)
    builder.add_node("player_word", player_word)
    builder.add_node("clear_player_word", clear_player_word)
    builder.add_node("update_player_last_letter", update_player_last_letter)
    builder.add_node("update_score", update_score)

    # new round -> agent say word / complete
    builder.set_entry_point("new_round")
    builder.add_conditional_edges("new_round", check_completed, {
        "completed": "completed",
        "get_agent_word": "get_agent_word"
    })

    # agent say word -> reject agent word / use agent word last letter
    builder.add_conditional_edges("get_agent_word", check_agent_word, {
        "clear_agent_word": "clear_agent_word",
        "update_agent_last_letter": "update_agent_last_letter"
    })

    # use agent word last letter -> wait player word
    builder.add_edge("update_agent_last_letter", "player_word")

    # get player word -> reject player word / use player word last letter
    builder.add_conditional_edges("player_word", check_player_word, {
        "clear_player_word": "clear_player_word",
        "update_player_last_letter": "update_player_last_letter"
    })

    # use player word last letter -> calculate score -> new round
    builder.add_edge("update_player_last_letter", "update_score")
    builder.add_edge("update_score", "new_round")

    # reject agent word -> say word
    # reject player word -> complete
    builder.add_edge("clear_agent_word", "get_agent_word")
    builder.add_edge("clear_player_word", "completed")
    # complete
    builder.add_edge("completed", END)

    return builder.compile(
        checkpointer=memory,
        interrupt_before=["player_word"]
    )
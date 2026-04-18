"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { startGame, submitWord, newGameId } from "@/lib/api";
import styles from "./page.module.css";

type Message = { role: "agent" | "player"; word: string };
type Difficulty = "easy" | "medium" | "hard";

export default function GamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [gameId, setGameId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<"idle" | "active" | "completed">("idle");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [error, setError] = useState("");
  const [won, setWon] = useState<boolean | null>(null);
  const [prevStreak, setPrevStreak] = useState(0);
  const [streakMessage, setStreakMessage] = useState("");
  const [showRules, setShowRules] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) { router.push("/"); return; }
    setUsername(u);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleStart() {
    setLoading(true);
    setError("");
    const id = newGameId();
    setGameId(id);
    localStorage.setItem("game_id", id);
    const data = await startGame(id, difficulty, username);
    setMessages([{ role: "agent", word: data.agent_word }]);
    setRound(data.current_round);
    setScore(0);
    setStreak(0);
    setWon(null);
    setStreakMessage("");
    setPrevStreak(0);
    setGameStatus("active");
    setLoading(false);
  }

  async function handleSubmit() {
    if (!input.trim() || loading) return;
    const word = input.trim().toLowerCase();
    setInput("");
    setLoading(true);
    setError("");

    setMessages(m => [...m, { role: "player", word }]);
    const data = await submitWord(word, gameId);

    if (data.error) {
      setMessages(m => m.slice(0, -1));
      setError(data.error);
      setLoading(false);
      return;
    }

    const newStreak = data.cascade_streak ?? 0;
    if (newStreak > prevStreak && newStreak > 0) {
      setStreakMessage("Creative word!");
    } else {
      setStreakMessage("");
    }
    setPrevStreak(newStreak);

    if (data.game_status === "completed") {
      setWon(data.current_round > 10);
      setGameStatus("completed");
    } else {
      setMessages(m => [...m, { role: "agent", word: data.agent_word }]);
    }

    setRound(data.current_round);
    setScore(data.total_score ?? 0);
    setStreak(data.cascade_streak ?? 0);
    setLoading(false);
  }

  function handleNewGame() {
    setGameStatus("idle");
    setMessages([]);
    setWon(null);
    setStreakMessage("");
    setPrevStreak(0);
    setError("");
    setScore(0);
    setStreak(0);
    setRound(0);
  }

  return (
    <div className={styles.layout}>
      <Nav />
      <div className={styles.container}>

        {gameStatus === "idle" && (
          <div className={styles.startPanel}>
            <h2 className={styles.heading}>New Game</h2>
            <p className={styles.hint}>Choose difficulty and start a game.</p>
            <div className={styles.diffRow}>
              {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                <button
                  key={d}
                  className={`btn ${difficulty === d ? "btn-accent" : "btn-ghost"}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <button className="btn btn-accent" onClick={handleStart} disabled={loading} style={{ marginTop: "0.5rem" }}>
              {loading ? "Starting..." : "Start Game"}
            </button>
          </div>
        )}

        {gameStatus !== "idle" && (
          <>
            <div className={styles.statsBar}>
              <span className={styles.stat}><span className={styles.label}>Round</span> {Math.min(round, 10)}</span>
              <span className={styles.stat}><span className={styles.label}>Score</span> {score}</span>
              <span className={styles.stat}><span className={styles.label}>Creativity Streak</span> {streak}</span>
              <span className={styles.statDiff}>{difficulty}</span>
              <span>
                <button className="btn btn-ghost" style={{ marginLeft: "auto" }} onClick={() => setShowRules(true)}>
                  Rules
                </button>
              </span>
            </div>

            <div className={styles.chat}>
              {messages.map((m, i) => (
                <div key={i} className={m.role === "agent" ? styles.agentRow : styles.playerRow}>
                  {m.role === "agent" && <span className={styles.avatar}>AI</span>}
                  <div className={m.role === "agent" ? styles.agentBubble : styles.playerBubble}>
                    {m.word}
                  </div>
                </div>
              ))}
              {loading && (
                <div className={styles.agentRow}>
                  <span className={styles.avatar}>AI</span>
                  <div className={styles.agentBubble}><span className={styles.dots}>...</span></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {streakMessage && (
              <p style={{ textAlign: "center", color: "#66FF00" }}>{streakMessage}</p>
            )}

            {gameStatus === "active" && (
              <div className={styles.inputRow}>
                <input
                  className="field"
                  placeholder={messages.length ? `Start with "${messages[messages.length - 1].word.slice(-1).toUpperCase()}"...` : "Your word..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  disabled={loading}
                  autoFocus
                />
                <button className="btn btn-accent" onClick={handleSubmit} disabled={loading || !input.trim()}>
                  Send
                </button>
              </div>
            )}

            {gameStatus === "completed" && (
              <div className={styles.endBanner}>
                {won
                  ? <p>YOU WIN! FINAL SCORE: <strong>{score}</strong></p>
                  : <p>YOU LOST! FINAL SCORE: <strong>{score}</strong></p>
                }
                <button className="btn btn-accent" onClick={handleNewGame}>
                  New Game
                </button>
              </div>
            )}
          </>
        )}

        {showRules && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99 }}>
            <div style={{ background: "var(--background)", padding: "2rem", borderRadius: "1rem", maxWidth: "420px", width: "90%" }}>
              <h3 style={{ marginBottom: "1rem" }}>How to Play</h3>
              <ul style={{ lineHeight: 2 }}>
                <li>Each word must start with the last letter of the previous word</li>
                <li>Words cannot be repeated</li>
                <li>Words must be real English words</li>
                <li>Survive all 10 rounds to win</li>
              </ul>
              <h3 style={{ margin: "1rem 0" }}>Difficulty AI Word Lengths</h3>
              <ul style={{ lineHeight: 2 }}>
                <li>Easy — 4 to 6 letters</li>
                <li>Medium — 6 to 8 letters</li>
                <li>Hard — 8 to 12 letters, no words ending in S</li>
              </ul>
              <h3 style={{ margin: "1rem 0" }}>Scoring</h3>
              <ul style={{ lineHeight: 2 }}>
                <li>Each valid word scores 10 points</li>
                <li>Creative words get +5 bonus</li>
                <li>Chain 3 or more creative words for a score multiplier and length bonus</li>
              </ul>
              <button className="btn btn-accent" style={{ marginTop: "1rem" }} onClick={() => setShowRules(false)}>
                Got it
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
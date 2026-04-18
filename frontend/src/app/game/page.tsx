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
    setGameStatus("active");
    setLoading(false);
  }

  async function handleSubmit() {
    if (!input.trim() || loading) return;
    const word = input.trim().toLowerCase();
    setInput("");
    setLoading(true);
    setError("");

    const lastWord = messages[messages.length - 1].word;
    if (word[0] !== lastWord[lastWord.length - 1]) {
      setError(`Word must start with "${lastWord[lastWord.length - 1].toUpperCase()}"`);
      setLoading(false);
      return;
    }

    setMessages(m => [...m, { role: "player", word }]);
    const data = await submitWord(word, gameId);

    if (data.error) {
      setError(data.error);
      setLoading(false);
      return;
    }

    // Only show agent word if game isn't over
    if (data.game_status === "completed") {
      setGameStatus("completed");
    } else {
      setMessages(m => [...m, { role: "agent", word: data.agent_word }]);
    }

    setRound(data.current_round);
    setScore(data.total_score ?? 0);
    setStreak(data.cascade_streak ?? 0);
    setLoading(false);
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
              {loading ? "Starting…" : "Start Game →"}
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
                  <div className={styles.agentBubble}><span className={styles.dots}>···</span></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            {gameStatus === "active" && (
              <div className={styles.inputRow}>
                <input
                  className="field"
                  placeholder={messages.length ? `Start with "${messages[messages.length - 1].word.slice(-1).toUpperCase()}"…` : "Your word…"}
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
                <p>Game over! Final score: <strong>{score}</strong></p>
                <button className="btn btn-accent" onClick={() => { setGameStatus("idle"); setMessages([]); }}>
                  New Game
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

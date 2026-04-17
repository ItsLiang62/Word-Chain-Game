"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { streamGameHistory } from "@/lib/api";
import styles from "./page.module.css";

export default function HistoryPage() {
  const router = useRouter();
  const [chunks, setChunks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) { router.push("/"); return; }

    (async () => {
      for await (const chunk of streamGameHistory(u)) {
        if (chunk.trim()) {
          const text = chunk.startsWith("data:") ? chunk.slice(5).trim() : chunk;
          if (text !== "null") setChunks(c => [...c, chunk]);
        }
      }
      setLoading(false);
    })();
  }, []);

  // Try to parse each chunk as JSON, fallback to raw text
  function renderChunk(raw: string, i: number) {
    try {
      const lines = raw.split("\n").filter(Boolean);
      return lines.map((line, j) => {
        const text = line.startsWith("data:") ? line.slice(5).trim() : line;
        try {
          const obj = JSON.parse(text);
          return (
            <div key={`${i}-${j}`} className={styles.card}>
              {Object.entries(obj).map(([k, v]) => (
                <div key={k} className={styles.row}>
                  <span className={styles.key}>{k.replace(/_/g, " ")}</span>
                  <span className={styles.val}>{String(v)}</span>
                </div>
              ))}
            </div>
          );
        } catch {
          return text ? <div key={`${i}-${j}`} className={styles.card}><p className={styles.raw}>{text}</p></div> : null;
        }
      });
    } catch {
      return <div key={i} className={styles.card}><p className={styles.raw}>{raw}</p></div>;
    }
  }

  return (
    <div className={styles.layout}>
      <Nav />
      <div className={styles.container}>
        <h2 className={styles.heading}>Game History</h2>
        {loading && <p className={styles.muted}>Streaming history…</p>}
        <div className={styles.list}>
          {chunks.length === 0 && !loading && <p className={styles.muted}>No game history found.</p>}
          {chunks.map((c, i) => renderChunk(c, i))}
        </div>
      </div>
    </div>
  );
}

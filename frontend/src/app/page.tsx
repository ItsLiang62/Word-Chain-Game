"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  function enter() {
    if (!username.trim()) return;
    localStorage.setItem("username", username.trim());
    router.push("/game");
  }

  return (
    <main className={styles.main}>
      <div className={styles.noise} />
      <div className={styles.card}>
        <div className={styles.logo}>W↩</div>
        <h1 className={styles.title}>Word Chain</h1>
        <p className={styles.sub}>Each word must start with the last letter of the previous one.</p>
        <div className={styles.form}>
          <input
            className="field"
            placeholder="Enter your username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === "Enter" && enter()}
            autoFocus
          />
          <button className="btn btn-accent" onClick={enter} style={{ width: "100%" }}>
            Play →
          </button>
        </div>
      </div>
    </main>
  );
}
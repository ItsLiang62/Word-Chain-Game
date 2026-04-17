"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { getPlayerStats } from "@/lib/api";
import styles from "./page.module.css";

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (!u) { router.push("/"); return; }
    getPlayerStats(u).then(s => { setStats(s); setLoading(false); });
  }, []);

  return (
    <div className={styles.layout}>
      <Nav />
      <div className={styles.container}>
        <h2 className={styles.heading}>My Statistics</h2>
        {loading && <p className={styles.muted}>Loading…</p>}
        {!loading && stats && (
          <div className={styles.grid}>
            {Object.entries(stats).map(([key, val]) => {
              const display = typeof val === "object" && val !== null
                ? Object.entries(val).map(([k, v]) => `${k}: ${v}`).join(" · ")
                : String(val);
              return (
                <div key={key} className={styles.card}>
                  <span className={styles.label}>{key.replace(/_/g, " ")}</span>
                  <span className={styles.value}>{display}</span>
                </div>
              );
            })}
          </div>
        )}
        {!loading && !stats && <p className={styles.muted}>No statistics found yet. Play some games first!</p>}
      </div>
    </div>
  );
}

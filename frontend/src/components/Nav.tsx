"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Nav.module.css";

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const username = typeof window !== "undefined" ? localStorage.getItem("username") : "";

  function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("game_id");
    router.push("/");
  }

  return (
    <nav className={styles.nav}>
      <Link href="/game" className={styles.brand}>W↩ Word Chain</Link>
      <div className={styles.links}>
        <Link href="/game" className={path === "/game" ? styles.active : ""}>Game</Link>
        <Link href="/stats" className={path === "/stats" ? styles.active : ""}>Stats</Link>
        <Link href="/history" className={path === "/history" ? styles.active : ""}>History</Link>
      </div>
      <div className={styles.right}>
        <span className={styles.user}>{username}</span>
        <span>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem" }}>
            Log Out
          </button>
        </span>
      </div>
    </nav>
  );
}

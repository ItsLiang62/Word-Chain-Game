const BASE = "https://word-chain-game-2l6k.onrender.com";

export async function startGame(game_id: string, difficulty: string, username: string) {
  const res = await fetch(`${BASE}/start?game_id=${game_id}&difficulty=${difficulty}&username=${encodeURIComponent(username)}`, { method: "POST" });
  return res.json();
}

export async function submitWord(word: string, game_id: string) {
  const res = await fetch(`${BASE}/submit_word?word=${encodeURIComponent(word)}&game_id=${game_id}`, { method: "POST" });
  return res.json();
}

export async function getGameInfo(game_id: string) {
  const res = await fetch(`${BASE}/game_info?game_id=${game_id}`, { method: "POST" });
  return res.json();
}

export async function getPlayerStats(username: string) {
  const res = await fetch(`${BASE}/player_stats?username=${encodeURIComponent(username)}`, { method: "POST" });
  return res.json();
}

export async function* streamGameHistory(username: string) {
  const res = await fetch(`${BASE}/game_history?username=${encodeURIComponent(username)}`, { method: "POST" });
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}

export function newGameId() {
  return Math.random().toString(36).slice(2, 10);
}

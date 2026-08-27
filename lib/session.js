const KEY = "unit5_quiz_session";

export function saveSession(seatNumber, name) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ seatNumber, name }));
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

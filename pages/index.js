import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { saveSession, getSession } from "../lib/session";

export default function Login() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [seatNumber, setSeatNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = getSession();
    if (existing) {
      router.replace("/select");
      return;
    }
    async function loadStudents() {
      try {
        const res = await fetch("/api/roster");
        const data = await res.json();
        setStudents(data.students || []);
      } catch {
        setStudents([]);
      }
    }
    loadStudents();
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!seatNumber) {
      setError("出席番号を選んでください");
      return;
    }
    if (!password) {
      setError("パスワードを入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatNumber, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "ログインに失敗しました");
        setLoading(false);
        return;
      }
      saveSession(seatNumber, data.name);
      router.push("/select");
    } catch (err) {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="header">
        <h1>Unit 5　確認クイズ</h1>
      </div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <img
          src="/mascot/wave.png"
          alt=""
          style={{ width: 110, height: "auto" }}
        />
      </div>
      <div className="card">
        <form onSubmit={handleLogin}>
          <label htmlFor="seat">出席番号</label>
          <select
            id="seat"
            value={seatNumber}
            onChange={(e) => setSeatNumber(e.target.value)}
          >
            <option value="">選んでください</option>
            {students.map((s) => (
              <option key={s.seat_number} value={s.seat_number}>
                {s.seat_number}　{s.name}
              </option>
            ))}
          </select>

          <label htmlFor="pw">パスワード</label>
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="先生に配布されたパスワードを入力"
          />

          {error && <p style={{ color: "#c0392b" }}>{error}</p>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

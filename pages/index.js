import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { saveSession, getSession } from "../lib/session";
import { CLASS_LIST, CLASS_LABELS, parseStudentKey } from "../lib/classUtils";

export default function Login() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [seatNumber, setSeatNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredMsg, setRegisteredMsg] = useState(false);

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

  // 選ばれたクラスの生徒だけに絞り込む（seat_number は "4-1" 形式）
  const studentsInClass = selectedClass
    ? students.filter((s) => parseStudentKey(s.seat_number).classNum === selectedClass)
    : [];

  function handleSelectClass(cls) {
    setSelectedClass(cls);
    setSeatNumber("");
    setError("");
  }

  function handleBackToClass() {
    setSelectedClass(null);
    setSeatNumber("");
    setError("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!seatNumber) {
      setError("出席番号を選んでください");
      return;
    }
    if (!/^\d{4}$/.test(password.trim())) {
      setError("パスワードは4桁の数字で入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatNumber, password: password.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "ログインに失敗しました");
        setLoading(false);
        return;
      }
      if (data.registered) {
        setRegisteredMsg(true);
        setTimeout(() => {
          saveSession(seatNumber, data.name);
          router.push("/select");
        }, 1400);
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
        <h1>Unit 4　確認クイズ</h1>
      </div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <img
          src="/mascot/wave.png"
          alt=""
          style={{ width: 110, height: "auto" }}
        />
      </div>
      <div className="card">
        {selectedClass === null ? (
          <>
            <label>クラスを選んでください</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {CLASS_LIST.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  className="btn"
                  style={{ flex: "1 1 auto", minWidth: 70 }}
                  onClick={() => handleSelectClass(cls)}
                >
                  {CLASS_LABELS[cls] ?? `${cls}組`}
                </button>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="seat">
                {CLASS_LABELS[selectedClass] ?? `${selectedClass}組`}　出席番号
              </label>
              <button type="button" className="btn secondary" onClick={handleBackToClass}>
                クラスを選び直す
              </button>
            </div>
            <select
              id="seat"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
            >
              <option value="">選んでください</option>
              {studentsInClass.map((s) => (
                <option key={s.seat_number} value={s.seat_number}>
                  {parseStudentKey(s.seat_number).number}番　{s.name}
                </option>
              ))}
            </select>

            <label htmlFor="pw">パスワード（4桁の数字）</label>
            <p className="muted" style={{ fontSize: 13, marginTop: -4, marginBottom: 6 }}>
              初めての人は、これから使うパスワードとして4桁の数字（誕生日など）を決めて入力しよう。次回からは同じ数字でログインできます。
            </p>
            <input
              id="pw"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder="例：0512"
            />

            {error && <p style={{ color: "#c0392b" }}>{error}</p>}
            {registeredMsg && (
              <p style={{ color: "#2f7d4f" }}>パスワードを登録したよ！これから始めよう。</p>
            )}

            <button className="btn" type="submit" disabled={loading || registeredMsg}>
              {loading ? "確認中..." : "ログイン"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const GRAMMARS = ["U4G1", "U4G2", "U4G3", "U4G4"];

export default function Teacher() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [students, setStudents] = useState([]);
  const [progress, setProgress] = useState([]);
  const [helps, setHelps] = useState([]);
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    const teacherPw = process.env.NEXT_PUBLIC_TEACHER_PASSWORD;
    if (teacherPw && pw === teacherPw) {
      setAuthed(true);
      loadAll();
    } else {
      alert("合言葉が違います");
    }
  }

  async function loadAll() {
    if (!supabase) return;
    setLoading(true);
    const [rosterRes, { data: pr }, { data: hp }] = await Promise.all([
      fetch("/api/roster").then((r) => r.json()),
      supabase.from("progress").select("*"),
      supabase
        .from("help_requests")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setStudents(rosterRes.students || []);
    setProgress(pr || []);
    setHelps(hp || []);
    setLoading(false);
  }

  useEffect(() => {
    if (authed) {
      const t = setInterval(loadAll, 15000); // 15秒ごとに自動更新
      return () => clearInterval(t);
    }
  }, [authed]);

  function cellFor(seat, grammar) {
    const rows = progress.filter((r) => r.seat_number === seat && r.grammar === grammar);
    const u1 = rows.some((r) => r.step === 0 && r.skill === "S1" && r.status === "passed");
    const u2 = rows.some((r) => r.step === 0 && r.skill === "S2" && r.status === "passed");
    const u3 = rows.some((r) => r.step === 0 && r.skill === "S3" && r.status === "passed");
    const step1Passed = rows.some((r) => r.step === 1 && r.status === "passed");
    const step2Passed = rows.some((r) => r.step === 2 && r.status === "passed");
    const step3Passed = rows.some((r) => r.step === 3 && r.status === "passed");

    if (!u1) return { label: "🔒Step1", color: "#aab4b8" };
    if (step1Passed && !u2) return { label: "🔒Step2", color: "#aab4b8" };
    if (step2Passed && !u3) return { label: "🔒Step3", color: "#aab4b8" };
    if (step3Passed) return { label: "Step3済", color: "#2e8b57" };
    if (step2Passed) return { label: "Step2合格", color: "#2e8b57" };
    if (step1Passed) return { label: "Step1済", color: "#e8a33d" };
    return { label: "取組中", color: "#e8a33d" };
  }

  function helpCountFor(seat) {
    return helps.filter((h) => h.seat_number === seat && !h.resolved).length;
  }

  if (!authed) {
    return (
      <div className="page">
        <div className="header">
          <h1>教師用ダッシュボード</h1>
        </div>
        <div className="card">
          <form onSubmit={login}>
            <label>合言葉</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button className="btn" type="submit">
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className="header">
        <h1>教師用ダッシュボード</h1>
        <button className="btn secondary" onClick={loadAll} disabled={loading}>
          {loading ? "更新中..." : "手動更新"}
        </button>
      </div>

      <div className="card">
        <p className="section-title">進捗マトリクス</p>
        <table className="dash">
          <thead>
            <tr>
              <th>出席番号</th>
              <th>氏名</th>
              {GRAMMARS.map((g) => (
                <th key={g}>{g}</th>
              ))}
              <th>ヘルプ回数</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.seat_number}>
                <td>{s.seat_number}</td>
                <td>{s.name}</td>
                {GRAMMARS.map((g) => {
                  const c = cellFor(s.seat_number, g);
                  return (
                    <td key={g} style={{ color: c.color, fontWeight: "bold" }}>
                      {c.label}
                    </td>
                  );
                })}
                <td>{helpCountFor(s.seat_number) > 0 ? `🙋${helpCountFor(s.seat_number)}` : "―"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <p className="section-title">直近のヘルプ要請</p>
        {helps.slice(0, 15).map((h) => (
          <p key={h.id} className="muted">
            {new Date(h.created_at).toLocaleTimeString("ja-JP")}　
            出席番号{h.seat_number}　{h.grammar} Step{h.step}
            {h.resolved ? "　✅解決済み" : "　🙋対応中"}
          </p>
        ))}
        {helps.length === 0 && <p className="muted">ヘルプ要請はまだありません</p>}
      </div>
    </div>
  );
}

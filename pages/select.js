import Icon from "../components/Icon";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../lib/session";

const GRAMMARS = [
  { id: "U4G1", label: "G1", desc: "must / mustn't" },
  { id: "U4G2", label: "G2", desc: "have to / don't have to" },
  { id: "U4G3", label: "G3", desc: "動名詞（目的語）" },
  { id: "U4G4", label: "G4", desc: "動名詞（主語）" },
];

function statusFor(progressRows, grammar) {
  const rows = progressRows.filter((r) => r.grammar === grammar);
  if (rows.some((r) => r.step === 3 && r.status === "passed")) {
    return { label: "Step3まで完了", cls: "passed" };
  }
  if (rows.some((r) => r.step === 2 && r.status === "passed")) {
    return { label: "Step2クリア（合格）", cls: "passed" };
  }
  if (rows.some((r) => r.step === 1 && r.status === "passed")) {
    return { label: "Step1完了", cls: "in_progress" };
  }
  if (rows.length > 0) {
    return { label: "取り組み中", cls: "in_progress" };
  }
  return { label: "未着手", cls: "none" };
}

export default function Select() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSession(s);
    loadProgress(s.seatNumber);
  }, [router]);

  async function loadProgress(seatNumber) {
    if (!supabase) return;
    const { data } = await supabase
      .from("progress")
      .select("grammar, step, status")
      .eq("seat_number", seatNumber);
    setProgress(data || []);
  }

  function logout() {
    clearSession();
    router.push("/");
  }

  if (!session) return null;

  return (
    <div className="page">
      <div className="header">
        <h1>Unit 5　確認クイズ</h1>
        <button className="btn secondary" onClick={logout}>
          ログアウト
        </button>
      </div>
      <p className="muted">
        {session.seatNumber}　{session.name} さん、どの授業回に取り組みますか？
      </p>

      {progress.some((r) => r.status === "passed") && (
        <div style={{ textAlign: "center", margin: "8px 0 4px" }}>
          <img
            src={
              GRAMMARS.every((g) => statusFor(progress, g.id).cls === "passed")
                ? "/mascot/thumbsup.png"
                : "/mascot/cheer.png"
            }
            alt=""
            style={{ width: 84, height: "auto" }}
          />
        </div>
      )}

      <button
        className="btn secondary"
        style={{ marginBottom: 16 }}
        onClick={() => router.push("/board")}
      >
        <Icon name="hand" size={18} /> みんなの進捗を見る
      </button>

      <div className="grid">
        {GRAMMARS.map((g) => {
          const st = statusFor(progress, g.id);
          return (
            <div
              key={g.id}
              className="tile"
              onClick={() => router.push(`/grammar/${g.id}`)}
            >
              <div className="big">{g.label}</div>
              <div className="muted">{g.desc}</div>
              <div className={`badge ${st.cls}`}>{st.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

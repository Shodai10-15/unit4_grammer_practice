import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import { getSession } from "../lib/session";

const GRAMMARS = ["U4G1", "U4G2", "U4G3", "U4G4"];

export default function Board() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [progress, setProgress] = useState([]);
  const [helps, setHelps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSession(s);
    loadAll();
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(loadAll, 15000);
    return () => clearInterval(t);
  }, [session]);

  async function loadAll() {
    if (!supabase) return;
    setLoading(true);
    const [rosterRes, { data: pr }, { data: hp }] = await Promise.all([
      fetch("/api/roster").then((r) => r.json()),
      supabase.from("progress").select("*"),
      supabase
        .from("help_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setStudents(rosterRes.students || []);
    setProgress(pr || []);
    setHelps(hp || []);
    setLoading(false);
  }

  function cellFor(seat, grammar) {
    const rows = progress.filter((r) => r.seat_number === seat && r.grammar === grammar);
    if (rows.some((r) => r.step === 3 && r.status === "passed")) return { label: "Step3済", cls: "passed" };
    if (rows.some((r) => r.step === 2 && r.status === "passed")) return { label: "Step2合格", cls: "passed" };
    if (rows.some((r) => r.step === 1 && r.status === "passed")) return { label: "Step1済", cls: "in_progress" };
    if (rows.length > 0) return { label: "取組中", cls: "in_progress" };
    return { label: "―", cls: "none" };
  }

  function isHelping(seat) {
    return helps.some((h) => h.seat_number === seat && !h.resolved);
  }

  if (!session) return null;

  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="header">
        <h1>みんなの進捗</h1>
        <button className="btn secondary" onClick={() => router.push("/select")}>
          自分の画面へ
        </button>
      </div>
      <p className="muted">
        🙋がついている人は今ヘルプを求めています。手が空いていたら助けに行こう！
      </p>

      <div className="card">
        <table className="dash">
          <thead>
            <tr>
              <th>出席番号</th>
              <th>氏名</th>
              {GRAMMARS.map((g) => (
                <th key={g}>{g}</th>
              ))}
              <th>ヘルプ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr
                key={s.seat_number}
                style={
                  isHelping(s.seat_number)
                    ? { background: "#fbe4e1" }
                    : undefined
                }
              >
                <td>{s.seat_number}</td>
                <td>{s.name}</td>
                {GRAMMARS.map((g) => {
                  const c = cellFor(s.seat_number, g);
                  return (
                    <td
                      key={g}
                      style={{
                        color:
                          c.cls === "passed"
                            ? "var(--ok)"
                            : c.cls === "in_progress"
                            ? "var(--orange)"
                            : "var(--muted)",
                        fontWeight: "bold",
                      }}
                    >
                      {c.label}
                    </td>
                  );
                })}
                <td>{isHelping(s.seat_number) ? "🙋" : "―"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="muted">更新中...</p>}
      </div>
    </div>
  );
}

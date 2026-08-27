import { useRouter } from "next/router";

const SETS = {
  // Unit4のワークシートを作るときに、ここに音声・答えのセットを追加します。
};

export default function AnswerPage() {
  const router = useRouter();
  const { slug } = router.query;
  const set = slug ? SETS[slug] : null;

  if (!slug) return null;
  if (!set) {
    return (
      <div className="page">
        <div className="header">
          <h1>こたえが見つかりません</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <h1>{set.title}</h1>
      </div>
      {set.sections.map((sec, i) => (
        <div className="card" key={i}>
          <p className="section-title">{sec.label}</p>
          {sec.lines.map((l, j) => (
            <p key={j} style={{ fontSize: 16, margin: "4px 0" }}>
              {l}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

import { useRouter } from "next/router";
import AudioPlayer from "../../components/AudioPlayer";

// ワークシートのQRコードから飛んでくる、音声再生専用ページ。
// hidden: 英文を表示しない（ディクテーション・リスニング用）
// visible: 英文を表示する（発音確認用）
const SETS = {
  // Unit4のワークシートを作るときに、ここに音声・答えのセットを追加します。
};

export default function ListenPage() {
  const router = useRouter();
  const { slug } = router.query;
  const set = slug ? SETS[slug] : null;

  if (!slug) return null;
  if (!set) {
    return (
      <div className="page">
        <div className="header">
          <h1>音声が見つかりません</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <h1>{set.title}</h1>
      </div>
      {set.items.map((text, i) => (
        <div className="card" key={i}>
          <p className="muted">問題 {i + 1}</p>
          <AudioPlayer text={text} />
          {!set.hidden && (
            <p style={{ fontSize: 18, fontWeight: "bold", marginTop: 12 }}>{text}</p>
          )}
        </div>
      ))}
    </div>
  );
}

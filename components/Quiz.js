import { useMemo, useRef, useState } from "react";
import AudioPlayer from "./AudioPlayer";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// questions: [{id, question, choice_a..d, correct, note}]
// audioMode: true の場合（Listening用）、英文は隠して音声のみで出題し、
// 解答後に初めて英文を表示する
// instructionText: audioMode時にページ上部に常に表示する問題文（指示文）
// onFinish(score, total) が呼ばれたら親側で結果を保存する
export default function Quiz({ questions, onFinish, audioMode, instructionText }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  // 間違えた問題のidを覚えておき、終了時に親へ渡す
  // （「間違えた問題だけもう一度挑戦する」機能のため）
  const wrongIdsRef = useRef([]);

  const q = questions[index];

  // 問題ごとに選択肢の並び順をシャッフルする（正解が毎回同じ位置にならないように）
  const choices = useMemo(() => {
    const raw = [
      ["A", q.choice_a],
      ["B", q.choice_b],
      ["C", q.choice_c],
      ["D", q.choice_d],
    ].filter(([, text]) => text);
    return shuffle(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  function pick(letter) {
    if (answered) return;
    setSelected(letter);
    setAnswered(true);
    if (letter === q.correct) {
      setScore((s) => s + 1);
    } else {
      wrongIdsRef.current.push(q.id);
    }
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      onFinish(score, questions.length, wrongIdsRef.current);
    }
  }

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="muted">
        問題 {index + 1} / {questions.length}
      </p>
      {audioMode && instructionText && (
        <p
          style={{
            fontWeight: "bold",
            fontSize: 16,
            background: "var(--bg-accent, #eaf4f2)",
            padding: "10px 14px",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          🎧 {instructionText}
        </p>
      )}
      <div className="card">
        {audioMode ? (
          <div style={{ marginBottom: 12 }}>
            {!answered && <AudioPlayer text={q.question} />}
            {answered && (
              <p style={{ fontSize: 18, fontWeight: "bold" }}>{q.question}</p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 18, fontWeight: "bold" }}>{q.question}</p>
        )}
        {choices.map(([letter, text]) => {
          let cls = "choice";
          if (answered) {
            if (letter === q.correct) cls += " correct";
            else if (letter === selected) cls += " incorrect";
          } else if (letter === selected) {
            cls += " selected";
          }
          return (
            <button key={letter} className={cls} onClick={() => pick(letter)}>
              {text}
            </button>
          );
        })}
        {answered && (
          <div style={{ marginTop: 12 }}>
            <p>
              {selected === q.correct ? "✅ 正解！" : "❌ 不正解"}
              {q.note ? `　（${q.note}）` : ""}
            </p>
            <button className="btn" onClick={next}>
              {index + 1 < questions.length ? "次の問題へ" : "結果を見る"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

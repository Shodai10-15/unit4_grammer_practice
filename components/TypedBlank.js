import { useState } from "react";
import { normalize } from "../lib/textSimilarity";

// questions: [{id, question, correct, note}]
// question内の「___」が空欄（複数可）。
// correctは正解（空欄が複数ある場合は "show|how" のように "|" 区切りで空欄の数だけ用意する）。
// noteは日本語訳。常に文の上に表示する（訳がないと穴埋めができないため）。
export default function TypedBlank({ questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [inputs, setInputs] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  const q = questions[index];
  const parts = q.question.split("___");
  const blankCount = parts.length - 1;
  const correctParts = (q.correct || "").split("|");

  function setInput(i, value) {
    const next = [...inputs];
    next[i] = value;
    setInputs(next);
  }

  function submit() {
    if (inputs.filter(Boolean).length < blankCount) {
      setError("すべての空欄を入力してから答え合わせしよう");
      return;
    }
    setError("");
    const correct = correctParts.every(
      (c, i) => normalize(inputs[i] || "") === normalize(c)
    );
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setInputs([]);
      setAnswered(false);
      setError("");
    } else {
      onFinish(score, questions.length);
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
      <div className="card">
        {q.note && (
          <p
            style={{
              background: "var(--bg-accent, #eaf4f2)",
              padding: "8px 12px",
              borderRadius: 8,
              fontWeight: "bold",
              fontSize: 15,
              marginBottom: 12,
            }}
          >
            日本語訳：{q.note}
          </p>
        )}
        <p style={{ fontSize: 18, fontWeight: "bold", lineHeight: 2.2 }}>
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < blankCount && (
                <input
                  type="text"
                  value={inputs[i] || ""}
                  onChange={(e) => setInput(i, e.target.value)}
                  disabled={answered}
                  style={{
                    display: "inline-block",
                    width: 110,
                    margin: "0 6px",
                    textAlign: "center",
                    borderColor: answered
                      ? isCorrect
                        ? "var(--ok, #2e8b57)"
                        : "var(--danger, #c0392b)"
                      : undefined,
                  }}
                  placeholder="英語"
                />
              )}
            </span>
          ))}
        </p>
        {error && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{error}</p>}
        {!answered && (
          <button className="btn" onClick={submit}>
            答え合わせ
          </button>
        )}
        {answered && (
          <div style={{ marginTop: 8 }}>
            <p>
              {isCorrect ? "✅ 正解！" : `❌ 不正解（正解: ${correctParts.join(" / ")}）`}
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

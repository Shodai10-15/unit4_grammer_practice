import { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import { wordAccuracy, exactMatch, missingWords } from "../lib/textSimilarity";

const DICTATION_PASS = 80;

// questions: [{id, question, note}]  question = 正解の英文、note = 日本語訳（ヒント用）
// 音声を聞いて、聞こえた英文をそのまま書き取る（一致率80%以上、または完全一致で合格）
// ※教室では音声認識（マイク入力）が雑音で安定しないため、発話チェックは行わない
export default function DictationShadowing({ questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const q = questions[index];

  function check() {
    if (!input.trim()) {
      setError("聞き取った英文を入力しよう");
      return;
    }
    setError("");
    const correct = exactMatch(q.question, input);
    const accuracy = wordAccuracy(q.question, input);
    setResult({ correct, accuracy, passed: correct || accuracy >= DICTATION_PASS });
  }

  function retry() {
    setResult(null);
    setInput("");
  }

  function nextQuestion() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setInput("");
      setResult(null);
      setShowHint(false);
      setError("");
    } else {
      onFinish(questions.length, questions.length);
    }
  }

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="muted">
        問題 {index + 1} / {questions.length}　ディクテーション
      </p>

      <div className="card">
        <p className="muted" style={{ marginBottom: 8 }}>
          音声を聞いて、聞こえた英文をそのまま入力しよう（一致率80%以上で合格）
        </p>
        <AudioPlayer text={q.question} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="聞こえた英文を入力"
          style={{ marginTop: 12 }}
          disabled={!!result}
        />
        <div className="btn-row" style={{ marginTop: 8 }}>
          {!result && (
            <button className="btn secondary" onClick={() => setShowHint((h) => !h)}>
              💡 ヒント
            </button>
          )}
        </div>
        {showHint && q.note && (
          <p className="muted" style={{ marginTop: 6 }}>
            日本語訳：{q.note}
          </p>
        )}
        {error && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{error}</p>}
        {!result && (
          <button className="btn" style={{ marginTop: 8 }} onClick={check}>
            答え合わせ
          </button>
        )}
        {result && (
          <div style={{ marginTop: 8 }}>
            <p>
              {result.correct ? "✅ 完全一致！" : `一致率 ${result.accuracy}%`}
              {!result.correct && result.passed && "　→ 80%以上なので合格です"}
            </p>
            {!result.correct && !result.passed && missingWords(q.question, input).length > 0 && (
              <p style={{ color: "var(--danger, #c0392b)", fontSize: 14 }}>
                💡 この単語を使おう！：{missingWords(q.question, input).join("、")}
              </p>
            )}
            <div className="btn-row">
              {!result.passed && (
                <button className="btn secondary" onClick={retry}>
                  もう一度書く
                </button>
              )}
              {result.passed && (
                <button className="btn" onClick={nextQuestion}>
                  {index + 1 < questions.length ? "次の問題へ" : "結果を見る"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

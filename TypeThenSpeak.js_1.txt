import { useEffect, useRef, useState } from "react";
import { wordAccuracy, exactMatch, missingWords } from "../lib/textSimilarity";

const PASS_THRESHOLD = 80;
const TIME_LIMIT_SEC = 20;

// questions: [{id, japanese, english}]
// フェーズ: write（日本語を見て英作文をタイプ、時間制限なし）
//         → retype（英文を隠して日本語だけ見て、もう一度タイプ。フェーズ開始と同時に20秒の
//            タイマーが動き、時間内に合格ラインに届かないと「時間切れ」になる）
// ※教室では音声認識（マイク入力）が雑音で安定しないため、発話チェックの代わりに
//   タイムアタック形式のタイピングチェックを行う
export default function TypeThenSpeak({ questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("write");
  const [input, setInput] = useState("");
  const [writeResult, setWriteResult] = useState(null);
  const [retypeInput, setRetypeInput] = useState("");
  const [retypeResult, setRetypeResult] = useState(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  const q = questions[index];

  function checkWrite() {
    if (!input.trim()) {
      setError("英文を入力しよう");
      return;
    }
    setError("");
    const correct = exactMatch(q.english, input);
    const accuracy = wordAccuracy(q.english, input);
    setWriteResult({ correct, accuracy });
  }

  function goToRetype() {
    setPhase("retype");
    setWriteResult(null);
    setInput("");
  }

  function retryWrite() {
    setWriteResult(null);
    setInput("");
  }

  function startTimer() {
    setTimedOut(false);
    setTimeLeft(TIME_LIMIT_SEC);
    if (timerRef.current) clearInterval(timerRef.current);
    const start = performance.now();
    const timer = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      const remaining = Math.max(0, Math.ceil(TIME_LIMIT_SEC - elapsed));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setTimedOut(true);
      }
    }, 200);
    timerRef.current = timer;
  }

  // retypeフェーズに入った瞬間から20秒のカウントダウンを開始する
  useEffect(() => {
    if (phase !== "retype") return;
    setRetypeInput("");
    setRetypeResult(null);
    setError("");
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  function checkRetype() {
    if (timedOut) return;
    if (!retypeInput.trim()) {
      setError("英文を入力しよう");
      return;
    }
    setError("");
    const correct = exactMatch(q.english, retypeInput);
    const accuracy = wordAccuracy(q.english, retypeInput);
    const passed = correct || accuracy >= PASS_THRESHOLD;
    if (passed && timerRef.current) {
      // 正解したのでタイマーを止める（時間切れによる失格を防ぐ）
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRetypeResult({ correct, accuracy, passed });
  }

  function retryRetype() {
    startTimer();
    setRetypeInput("");
    setRetypeResult(null);
    setError("");
  }

  function nextQuestion() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPhase("write");
      setInput("");
      setWriteResult(null);
      setRetypeResult(null);
      setError("");
    } else {
      onFinish(questions.length, questions.length);
    }
  }

  const retypePassed = retypeResult && retypeResult.passed && !timedOut;

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="muted">
        問題 {index + 1} / {questions.length}　
        {phase === "write" ? "①英作文" : "②タイムアタック（80%以上・20秒以内で合格）"}
      </p>

      <div className="card">
        <p style={{ fontSize: 18, fontWeight: "bold" }}>{q.japanese}</p>

        {phase === "write" && (
          <>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="英文を入力しよう"
              style={{ marginTop: 12 }}
              disabled={!!writeResult}
            />
            {error && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{error}</p>}
            {!writeResult && (
              <button className="btn" onClick={checkWrite}>
                答え合わせ
              </button>
            )}
            {writeResult && (
              <div style={{ marginTop: 8 }}>
                <p>
                  {writeResult.correct
                    ? "✅ 正解！"
                    : `❌ まだ100%ではありません（一致度 ${writeResult.accuracy}%）。もう一度書いてみよう`}
                </p>
                {!writeResult.correct && missingWords(q.english, input).length > 0 && (
                  <p style={{ color: "var(--danger, #c0392b)", fontSize: 14 }}>
                    💡 この単語を使おう！：{missingWords(q.english, input).join("、")}
                  </p>
                )}
                <div className="btn-row">
                  {!writeResult.correct && (
                    <button className="btn secondary" onClick={retryWrite}>
                      もう一度書く
                    </button>
                  )}
                  {writeResult.correct && (
                    <button className="btn" onClick={goToRetype}>
                      タイムアタックへ進む
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {phase === "retype" && (
          <>
            <p className="muted" style={{ marginTop: 8 }}>
              英語は表示されません。日本語だけを見て、もう一度英語を入力しよう
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: "bold",
                color: timeLeft <= 5 ? "var(--danger, #c0392b)" : "var(--text-primary, #23303a)",
                marginTop: 8,
              }}
            >
              ⏱ 残り {timeLeft} 秒
            </p>
            <input
              type="text"
              value={retypeInput}
              onChange={(e) => setRetypeInput(e.target.value)}
              placeholder="英文を入力しよう"
              style={{ marginTop: 8 }}
              disabled={timedOut || retypePassed}
            />
            {timedOut && !retypePassed && (
              <p style={{ color: "var(--danger, #c0392b)", fontWeight: "bold" }}>
                ⏰ 時間切れ！もう一度チャレンジしよう
              </p>
            )}
            {error && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{error}</p>}
            {!timedOut && !retypePassed && (
              <button className="btn" style={{ marginTop: 8 }} onClick={checkRetype}>
                答え合わせ
              </button>
            )}
            {timedOut && (
              <button className="btn secondary" style={{ marginTop: 8, marginLeft: 8 }} onClick={retryRetype}>
                🔄 もう一度（20秒リセット）
              </button>
            )}
            {retypeResult && (
              <div style={{ marginTop: 8 }}>
                <p>
                  {retypeResult.correct ? "✅ 完全一致！" : `一致率 ${retypeResult.accuracy}%`}
                  {!retypeResult.correct && retypeResult.passed && "　→ 80%以上なので合格です"}
                </p>
                {!retypeResult.correct && !retypeResult.passed && !timedOut &&
                  missingWords(q.english, retypeInput).length > 0 && (
                    <p style={{ color: "var(--danger, #c0392b)", fontSize: 14 }}>
                      💡 この単語を使おう！：{missingWords(q.english, retypeInput).join("、")}
                    </p>
                  )}
                <div className="btn-row">
                  {!retypeResult.passed && !timedOut && (
                    <button
                      className="btn secondary"
                      onClick={() => {
                        setRetypeResult(null);
                        setRetypeInput("");
                      }}
                    >
                      もう一度入力する
                    </button>
                  )}
                  {retypePassed && (
                    <button className="btn" onClick={nextQuestion}>
                      {index + 1 < questions.length ? "次の問題へ" : "結果を見る"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
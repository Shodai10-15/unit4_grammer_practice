import { useEffect, useRef, useState } from "react";
import { listenOnce, isSpeechRecognitionSupported } from "../lib/speechRecognition";
import { wordAccuracy, exactMatch, wordMatchDetail } from "../lib/textSimilarity";

const PASS_THRESHOLD = 80;
const TIME_LIMIT_SEC = 15;

// questions: [{id, japanese, english}]
// フェーズ: write（日本語を見て英作文をタイプ）
//         → speak（英語を隠して日本語だけ見て発話。フェーズ開始と同時に15秒のタイマーが動き、
//            時間内に合格ラインに届かないと「時間切れ」になる）
export default function TypeThenSpeak({ questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("write");
  const [input, setInput] = useState("");
  const [writeResult, setWriteResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [speakResult, setSpeakResult] = useState(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  const supported = isSpeechRecognitionSupported();
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

  function goToSpeak() {
    setPhase("speak");
    setWriteResult(null);
    setInput("");
  }

  function retryWrite() {
    setWriteResult(null);
    setInput("");
  }

  // speakフェーズに入った瞬間から15秒のカウントダウンを開始する
  useEffect(() => {
    if (phase !== "speak") return;
    setTimeLeft(TIME_LIMIT_SEC);
    setTimedOut(false);
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
    return () => clearInterval(timer);
  }, [phase, index]);

  function restartTimer() {
    setTimedOut(false);
    setTimeLeft(TIME_LIMIT_SEC);
    setSpeakResult(null);
    setError("");
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

  function startSpeak() {
    if (!supported) {
      setError("このブラウザは音声認識に対応していません（Chrome、またはEdgeでお試しください）");
      return;
    }
    if (timedOut) return;
    setError("");
    setListening(true);
    setSpeakResult(null);
    listenOnce({
      onResult: (transcript) => {
        const result = wordMatchDetail(q.english, transcript);
        const passed = result.ratio >= PASS_THRESHOLD;
        if (passed && timerRef.current) {
          // 正解したのでタイマーを止める（時間切れによる失格を防ぐ）
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (passed) setTimedOut(false);
        setSpeakResult({ ...result, transcript });
      },
      onError: (err) => {
        setError("うまく聞き取れませんでした（" + err + "）。もう一度試そう");
      },
      onEnd: () => setListening(false),
    });
  }

  function nextQuestion() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPhase("write");
      setInput("");
      setWriteResult(null);
      setSpeakResult(null);
      setError("");
    } else {
      onFinish(questions.length, questions.length);
    }
  }

  const speakPassed = speakResult && speakResult.ratio >= PASS_THRESHOLD && !timedOut;

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="muted">
        問題 {index + 1} / {questions.length}　
        {phase === "write" ? "①英作文" : "②発話（80%以上・15秒以内で合格）"}
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
                <div className="btn-row">
                  {!writeResult.correct && (
                    <button className="btn secondary" onClick={retryWrite}>
                      もう一度書く
                    </button>
                  )}
                  {writeResult.correct && (
                    <button className="btn" onClick={goToSpeak}>
                      発話練習へ進む
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {phase === "speak" && (
          <>
            <p className="muted" style={{ marginTop: 8 }}>
              英語は表示されません。日本語だけを見て、声に出して英語で言おう
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
            {timedOut && !speakPassed && (
              <p style={{ color: "var(--danger, #c0392b)", fontWeight: "bold" }}>
                ⏰ 時間切れ！もう一度チャレンジしよう
              </p>
            )}
            {!supported && (
              <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>
                このブラウザは音声認識に対応していません（Chrome、またはEdgeでお試しください）
              </p>
            )}
            <button
              className="btn"
              style={{ marginTop: 8 }}
              onClick={startSpeak}
              disabled={listening || !supported || timedOut}
            >
              {listening ? "🎤 聞き取り中..." : "🎤 話す"}
            </button>
            {timedOut && (
              <button className="btn secondary" style={{ marginTop: 8, marginLeft: 8 }} onClick={restartTimer}>
                🔄 もう一度（15秒リセット）
              </button>
            )}
            {error && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{error}</p>}
            {speakResult && (
              <div style={{ marginTop: 8 }}>
                <p className="muted">認識結果: {speakResult.transcript}</p>
                <p>
                  一致率 {speakResult.ratio}%　
                  {speakPassed ? "✅ 合格！" : timedOut ? "" : "もう少し！もう一度話してみよう"}
                </p>
                <div className="btn-row">
                  {!speakPassed && !timedOut && (
                    <button className="btn secondary" onClick={startSpeak}>
                      もう一度話す
                    </button>
                  )}
                  {speakPassed && (
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
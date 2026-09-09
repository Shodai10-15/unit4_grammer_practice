import { useEffect, useRef, useState } from "react";
import { wordAccuracy, exactMatch, missingWords } from "../lib/textSimilarity";
import AskAIButton from "./AskAIButton";
import { supabase } from "../lib/supabase";

const PASS_THRESHOLD = 80;
const TIME_LIMIT_SEC = 20;
// 同じ問題（同じフェーズ）で連続してこの回数不正解になったら、
// 一度ワークシートに戻るよう促すクールダウンに入る。
const COOLDOWN_THRESHOLD = 3;
const COOLDOWN_SEC = 60;

// questions: [{id, japanese, english}]
// フェーズ: write（日本語を見て英作文をタイプ、時間制限なし）
//         → retype（英文を隠して日本語だけ見て、もう一度タイプ。フェーズ開始と同時に20秒の
//            タイマーが動き、時間内に合格ラインに届かないと「時間切れ」になる）
// ※教室では音声認識（マイク入力）が雑音で安定しないため、発話チェックの代わりに
//   タイムアタック形式のタイピングチェックを行う
//
// grammar/step/skill/seatNumber: 集計用にquiz_attemptsへ1回の答え合わせごとに
// ログを残すために必要（間違えた回数・ヒントモード使用有無を後で分析するため）。
export default function TypeThenSpeak({ questions, onFinish, grammar, step, skill, seatNumber }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("write");
  const [input, setInput] = useState("");
  const [writeResult, setWriteResult] = useState(null);
  const [retypeInput, setRetypeInput] = useState("");
  const [retypeResult, setRetypeResult] = useState(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [timedOut, setTimedOut] = useState(false);
  // ヒントモード：ONにすると日本語を英語の語順に並べ替えて表示する（難しい生徒向け）
  // 端末に保存して次回も覚えておく
  const [hintMode, setHintMode] = useState(false);
  // 同じ問題・同じフェーズでの連続不正解カウントと、クールダウン残り秒数
  // （0のときは非アクティブ）。
  const [wrongStreak, setWrongStreak] = useState(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const timerRef = useRef(null);
  const cooldownTimerRef = useRef(null);

  useEffect(() => {
    try {
      setHintMode(localStorage.getItem("u4_hint_mode") === "1");
    } catch {
      // localStorageが使えない環境では何もしない
    }
  }, []);

  // アンマウント時に両方のタイマーを止める
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  function toggleHintMode() {
    setHintMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("u4_hint_mode", next ? "1" : "0");
      } catch {
        // 保存できなくても動作には影響しない
      }
      return next;
    });
  }

  const q = questions[index];
  const hintOrder = q && Array.isArray(q.hintOrder) ? q.hintOrder : [];

  // 答え合わせのたびにquiz_attemptsへ1件記録する（正解・不正解どちらも）。
  // 生徒の画面には影響しない裏側のログで、失敗しても学習の流れを止めないよう
  // 結果を待たずに投げっぱなしにする。
  function logAttempt(phase, correct, accuracy) {
    if (!supabase || !seatNumber || !grammar) return;
    supabase
      .from("quiz_attempts")
      .insert({
        seat_number: seatNumber,
        grammar,
        step: step ?? null,
        skill: skill || null,
        question_id: q?.id ?? null,
        phase,
        correct,
        accuracy,
        hint_mode: hintMode,
      })
      .then(() => {})
      .catch(() => {
        // ログの失敗で学習体験を止めないよう、ここでは何もしない
      });
  }

  // 連続不正解がCOOLDOWN_THRESHOLDに達したら60秒のクールダウンに入る。
  // その間はチャレンジのボタンの代わりに「ワークシートに戻ろう」の案内を表示する。
  function startCooldown() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    setCooldownLeft(COOLDOWN_SEC);
    const start = performance.now();
    const timer = setInterval(() => {
      const elapsed = (performance.now() - start) / 1000;
      const remaining = Math.max(0, Math.ceil(COOLDOWN_SEC - elapsed));
      setCooldownLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        cooldownTimerRef.current = null;
        setWrongStreak(0);
        setError("");
        if (phase === "retype") {
          retryRetype();
        } else {
          setWriteResult(null);
          setInput("");
        }
      }
    }, 200);
    cooldownTimerRef.current = timer;
  }

  function registerResult(passed) {
    if (passed) {
      setWrongStreak(0);
      return;
    }
    setWrongStreak((prev) => {
      const next = prev + 1;
      if (next >= COOLDOWN_THRESHOLD) startCooldown();
      return next;
    });
  }

  function checkWrite() {
    if (!input.trim()) {
      setError("英文を入力しよう");
      return;
    }
    setError("");
    const correct = exactMatch(q.english, input);
    const accuracy = wordAccuracy(q.english, input);
    setWriteResult({ correct, accuracy });
    logAttempt("write", correct, accuracy);
    registerResult(correct);
  }

  function goToRetype() {
    setPhase("retype");
    setWriteResult(null);
    setInput("");
    setWrongStreak(0);
    setCooldownLeft(0);
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
    logAttempt("retype", correct, accuracy);
    registerResult(passed);
  }

  function retryRetype() {
    startTimer();
    setRetypeInput("");
    setRetypeResult(null);
    setError("");
  }

  function nextQuestion() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    setWrongStreak(0);
    setCooldownLeft(0);
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

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          marginBottom: 8,
          cursor: "pointer",
        }}
      >
        <input type="checkbox" checked={hintMode} onChange={toggleHintMode} />
        💡 ヒントモード（日本語を英語の語順に並べ替えて表示する）
      </label>

      <div className="card">
        <p style={{ fontSize: 18, fontWeight: "bold" }}>{q.japanese}</p>
        {hintMode && hintOrder.length > 0 && (
          <p
            className="muted"
            style={{
              fontSize: 14,
              marginTop: 4,
              background: "var(--bg-accent, #eaf4f2)",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            語順：{hintOrder.join("　／　")}
          </p>
        )}

        {cooldownLeft > 0 && (
          <div
            style={{
              marginTop: 12,
              background: "#fff4e5",
              border: "1px solid #f0c987",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>
              📝 一度ワークシートに戻ろう
            </p>
            <p className="muted" style={{ fontSize: 14, margin: "0 0 8px 0" }}>
              まだこの英文が定着していないみたい。紙のワークシートに、この英文をもう一度書いてみよう。
            </p>
            <p style={{ fontSize: 22, fontWeight: "bold", margin: 0 }}>
              ⏱ あと {cooldownLeft} 秒
            </p>
          </div>
        )}

        {cooldownLeft === 0 && phase === "write" && (
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
                {!writeResult.correct && (
                  <AskAIButton japanese={q.japanese} correct={q.english} userInput={input} />
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

        {cooldownLeft === 0 && phase === "retype" && (
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
                {!retypeResult.correct && !retypeResult.passed && !timedOut && (
                  <AskAIButton japanese={q.japanese} correct={q.english} userInput={retypeInput} />
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
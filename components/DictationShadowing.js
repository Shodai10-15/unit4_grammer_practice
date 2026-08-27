import { useEffect, useRef, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import { isSpeechRecognitionSupported } from "../lib/speechRecognition";
import { wordAccuracy, exactMatch, wordMatchDetail } from "../lib/textSimilarity";

const DICTATION_PASS = 80;
const SHADOW_PASS = 90; // 1語程度の誤りまでは合格にする

// questions: [{id, question, note}]  question = 正解の英文、note = 日本語訳（ヒント用）
// フェーズ: dictation（聞いて書き取る・一致率80%以上で次へ）
//         → shadowing（英文非表示・再生と同時に録音、再生終了で自動停止。
//            不正解時は英文もヒントも出さず「何語間違っているか」だけを表示する）
export default function DictationShadowing({ questions, onFinish }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("dictation");
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [dictationResult, setDictationResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [shadowResult, setShadowResult] = useState(null);
  const [error, setError] = useState("");
  const recognizerRef = useRef(null);

  const supported = isSpeechRecognitionSupported();
  const q = questions[index];

  function checkDictation() {
    if (!input.trim()) {
      setError("聞き取った英文を入力しよう");
      return;
    }
    setError("");
    const correct = exactMatch(q.question, input);
    const accuracy = wordAccuracy(q.question, input);
    setDictationResult({ correct, accuracy, passed: correct || accuracy >= DICTATION_PASS });
  }

  function goToShadowing() {
    setPhase("shadowing");
    setDictationResult(null);
    setInput("");
    setShowHint(false);
  }

  function retryDictation() {
    setDictationResult(null);
    setInput("");
  }

  // 録音を伴わない「聞くだけ」の練習再生
  function practiceListen() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setPracticing(true);
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(q.question);
    utter.lang = "en-US";
    utter.rate = 0.75;
    utter.onend = () => setPracticing(false);
    utter.onerror = () => setPracticing(false);
    window.speechSynthesis.speak(utter);
  }

  function startShadowing() {
    if (!supported) {
      setError("このブラウザは音声認識に対応していません（Chrome、またはEdgeでお試しください）");
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    setError("");
    setListening(true);
    setShadowResult(null);

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognizer = new SR();
    recognizer.lang = "en-US";
    recognizer.continuous = true;
    recognizer.interimResults = false;
    let recognizedText = "";

    recognizer.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++) {
        recognizedText += " " + e.results[i][0].transcript;
      }
    };
    recognizer.onerror = (e) => {
      setError("うまく聞き取れませんでした（" + e.error + "）。もう一度試そう");
    };
    recognizer.onend = () => {
      setListening(false);
      const result = wordMatchDetail(q.question, recognizedText);
      setShadowResult({ ...result, transcript: recognizedText.trim() });
    };

    recognizerRef.current = recognizer;
    recognizer.start();

    // 音声再生と録音（音声認識）を同時に開始し、再生終了で自動的に録音を止める
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(q.question);
    utter.lang = "en-US";
    utter.rate = 0.75;
    utter.onend = () => {
      setTimeout(() => {
        if (recognizerRef.current) recognizerRef.current.stop();
      }, 900);
    };
    utter.onerror = () => {
      if (recognizerRef.current) recognizerRef.current.stop();
    };
    window.speechSynthesis.speak(utter);
  }

  useEffect(() => {
    return () => {
      if (recognizerRef.current) recognizerRef.current.stop();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function nextQuestion() {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPhase("dictation");
      setInput("");
      setDictationResult(null);
      setShadowResult(null);
      setShowHint(false);
      setError("");
    } else {
      onFinish(questions.length, questions.length);
    }
  }

  const shadowPassed = shadowResult && shadowResult.ratio >= SHADOW_PASS;
  const wrongCount = shadowResult ? shadowResult.total - shadowResult.matchedCount : 0;

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="muted">
        問題 {index + 1} / {questions.length}　
        {phase === "dictation" ? "①ディクテーション" : "②シャドーイング"}
      </p>

      {phase === "dictation" && (
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
            disabled={!!dictationResult}
          />
          <div className="btn-row" style={{ marginTop: 8 }}>
            {!dictationResult && (
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
          {!dictationResult && (
            <button className="btn" style={{ marginTop: 8 }} onClick={checkDictation}>
              答え合わせ
            </button>
          )}
          {dictationResult && (
            <div style={{ marginTop: 8 }}>
              <p>
                {dictationResult.correct
                  ? "✅ 完全一致！"
                  : `一致率 ${dictationResult.accuracy}%（正解: ${q.question}）`}
                {!dictationResult.correct && dictationResult.passed && "　→ 80%以上なので合格です"}
              </p>
              <div className="btn-row">
                {!dictationResult.passed && (
                  <button className="btn secondary" onClick={retryDictation}>
                    もう一度書く
                  </button>
                )}
                {dictationResult.passed && (
                  <button className="btn" onClick={goToShadowing}>
                    シャドーイングへ進む
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "shadowing" && (
        <div className="card">
          <p className="muted" style={{ marginBottom: 8 }}>
            英文は表示されません。ボタンを押すと音声が流れるので、聞こえた通りに同時に声に出して読もう（シャドーイング）。再生が終わると自動で録音も止まります。
          </p>
          {!supported && (
            <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>
              このブラウザは音声認識に対応していません（Chrome、またはEdgeでお試しください）
            </p>
          )}
          <div className="btn-row">
            <button
              className="btn"
              onClick={startShadowing}
              disabled={listening || practicing || !supported}
            >
              {listening ? "🔊🎤 再生・録音中..." : "🔊🎤 再生しながら話す"}
            </button>
            <button
              className="btn secondary"
              onClick={practiceListen}
              disabled={listening || practicing}
            >
              {practicing ? "🔈 再生中..." : "🔈 もう一度聞く（練習）"}
            </button>
          </div>
          {error && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{error}</p>}
          {shadowResult && (
            <div style={{ marginTop: 12 }}>
              {shadowPassed ? (
                <>
                  <p style={{ fontWeight: "bold", color: "#2e8b57" }}>
                    ✅ 合格！（一致率 {shadowResult.ratio}%）
                  </p>
                  <p className="muted">正解の文：{q.question}</p>
                </>
              ) : (
                <p style={{ fontWeight: "bold", color: "#c0392b" }}>
                  ❌ {shadowResult.total}語中 {wrongCount}語 違います（一致率 {shadowResult.ratio}%）
                  <br />
                  <span style={{ fontWeight: "normal" }}>
                    「もう一度聞く」で確認してから、もう一度話してみよう
                  </span>
                </p>
              )}
              <div className="btn-row">
                {!shadowPassed && (
                  <button className="btn secondary" onClick={startShadowing}>
                    もう一度話す
                  </button>
                )}
                {shadowPassed && (
                  <button className="btn" onClick={nextQuestion}>
                    {index + 1 < questions.length ? "次の問題へ" : "結果を見る"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

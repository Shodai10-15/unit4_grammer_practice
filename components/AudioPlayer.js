import { useEffect, useRef, useState } from "react";

// ブラウザの読み上げ機能（Web Speech API）を使った音声プレーヤー。
// 録音ファイルではないため厳密な秒単位のシークはできませんが、
// タイムラインをドラッグすると、その位置に近い単語から読み上げを再開する
// 疑似的なシークに対応しています。
const BASE_RATE = 0.75;
const WORDS_PER_MINUTE_AT_RATE1 = 150;

export default function AudioPlayer({ text }) {
  const [displayRate, setDisplayRate] = useState(1.0);
  const [progress, setProgress] = useState(0); // 0-100
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);
  const dragValueRef = useRef(null);

  const words = text.trim().split(/\s+/);

  useEffect(() => {
    setProgress(0);
    setPlaying(false);
    clearTimer();
    return () => {
      clearTimer();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function speakFrom(fraction) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    clearTimer();

    const startWordIndex = Math.min(
      words.length - 1,
      Math.floor(fraction * words.length)
    );
    const remainingText = words.slice(startWordIndex).join(" ");
    const actualRate = displayRate * BASE_RATE;
    const totalEstimatedMs =
      (words.length / (WORDS_PER_MINUTE_AT_RATE1 * actualRate)) * 60000;
    const baseProgress = (startWordIndex / words.length) * 100;
    const remainingEstimatedMs = Math.max(
      200,
      totalEstimatedMs * (1 - startWordIndex / words.length)
    );

    if (!remainingText) {
      setProgress(100);
      setPlaying(false);
      return;
    }

    const utter = new window.SpeechSynthesisUtterance(remainingText);
    utter.lang = "en-US";
    utter.rate = actualRate;

    const startTime = performance.now();
    setPlaying(true);
    setProgress(baseProgress);

    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct =
        baseProgress + Math.min(1, elapsed / remainingEstimatedMs) * (97 - baseProgress);
      setProgress(Math.min(97, pct));
    }, 60);

    utter.onend = () => {
      clearTimer();
      setProgress(100);
      setPlaying(false);
    };
    utter.onerror = () => {
      clearTimer();
      setPlaying(false);
    };

    window.speechSynthesis.speak(utter);
  }

  function play() {
    speakFrom(progress >= 99 ? 0 : progress / 100);
  }

  function stop() {
    clearTimer();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }

  function handleSeekChange(e) {
    dragValueRef.current = parseFloat(e.target.value);
    setProgress(dragValueRef.current);
  }

  function commitSeek() {
    if (dragValueRef.current === null) return;
    const fraction = dragValueRef.current / 100;
    dragValueRef.current = null;
    speakFrom(fraction >= 0.99 ? 0.99 : fraction);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button className="btn secondary" onClick={playing ? stop : play}>
          {playing ? "⏹ 停止" : "🔊 音声を聞く"}
        </button>
        <span style={{ fontSize: 13, color: "var(--text-secondary, #6b7a83)" }}>
          速度 {displayRate.toFixed(2)}x
        </span>
      </div>
      <input
        type="range"
        min="0.75"
        max="1.25"
        step="0.05"
        value={displayRate}
        onChange={(e) => setDisplayRate(parseFloat(e.target.value))}
        style={{ width: "100%", marginBottom: 14 }}
      />
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={progress}
        onChange={handleSeekChange}
        onMouseUp={commitSeek}
        onTouchEnd={commitSeek}
        style={{ width: "100%", marginBottom: 4 }}
      />
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        タイムラインをドラッグすると、その位置から聞き直せます（推定位置のため厳密な秒数ではありません）
      </p>
    </div>
  );
}

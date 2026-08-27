// ブラウザの音声認識機能（Web Speech API）の薄いラッパー。
// Chrome・Edge（どちらもChromiumエンジン）での動作を想定。対応していないブラウザでは isSupported が false になる。
export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listenOnce({ onResult, onError, onEnd }) {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    if (onError) onError("このブラウザは音声認識に対応していません（Chrome、またはEdgeを使ってください）");
    return null;
  }
  const recognition = new SR();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (onResult) onResult(transcript);
  };
  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };
  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  recognition.start();
  return recognition;
}

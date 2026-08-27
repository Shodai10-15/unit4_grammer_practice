export function speak(text, rate = 0.75) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new window.SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

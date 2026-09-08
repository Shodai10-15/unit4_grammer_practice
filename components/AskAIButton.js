import { useState } from "react";

// 間違えたときに「AIに聞いてみる」ボタンを出す。
// 質問文を自動生成してクリップボードにコピーし、Copilotを新しいタブで開く。
export default function AskAIButton({ japanese, correct, userInput }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);

  const prompt = `中学2年生の英語の問題です。「${japanese}」を英語にする問題で、正解は「${correct}」です。私は「${
    userInput && userInput.trim() ? userInput : "（まだ書いていません）"
  }」と書きましたが、正解と違いました。どこが違うのか、中学生にわかるように優しく教えてください。`;

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setFallback(false);
    } catch {
      setFallback(true);
      setCopied(false);
    }
    window.open("https://copilot.microsoft.com/", "_blank");
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button className="btn secondary" onClick={handleClick}>
        🤖 AIに聞いてみる
      </button>
      {copied && (
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          質問をコピーしました。開いたCopilotの画面に貼り付け（Ctrl+V）て送ってみよう！
        </p>
      )}
      {fallback && (
        <div style={{ marginTop: 6 }}>
          <p className="muted" style={{ fontSize: 12 }}>
            コピーができなかったので、下の文章を自分でコピーしてCopilotに貼り付けてね
          </p>
          <textarea readOnly value={prompt} style={{ width: "100%", fontSize: 12 }} rows={3} />
        </div>
      )}
    </div>
  );
}

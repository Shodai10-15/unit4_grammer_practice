import { useState } from "react";

// 間違えたときに「AIに聞いてみる」ボタンを出す。
// 質問文を自動生成してクリップボードにコピーし、Copilotを新しいタブで開く。
export default function AskAIButton({ japanese, correct, userInput }) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);

  // 正解（correct）はあえてプロンプトに含めない。
  // AIが答えをそのまま教えてしまうと生徒が考えずに写すだけになるため、
  // 「なぜ間違っているか」「どこを見直せばよいか」だけをヒントとして
  // 引き出させ、正解そのものは言わないよう明示的にお願いする。
  const prompt = `中学2年生の英語の問題です。「${japanese}」という日本語を英語にする問題を解いています。私は「${
    userInput && userInput.trim() ? userInput : "（まだ書いていません）"
  }」と書きましたが、不正解でした。

お願いしたいこと：
・正解の英文はまだ教えないでください。
・私が書いた英文のどこが間違っているのか（文法、単語、語順など）を、ヒントとして優しく説明してください。
・「〜の部分を見直してみよう」「〜を表す単語を確認してみよう」のように、自分で正解にたどり着けるように導いてください。
・中学2年生にわかる言葉で説明してください。`;

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

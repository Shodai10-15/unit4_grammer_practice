// ディクテーション・シャドーイング・発話チェックで使う、文字列の一致度判定ユーティリティ

export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?'";:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

// 単語単位で編集距離を取り、一致度（0〜100）を返す
export function wordAccuracy(target, said) {
  const targetWords = normalize(target).split(" ").filter(Boolean);
  const saidWords = normalize(said).split(" ").filter(Boolean);
  if (targetWords.length === 0) return 0;
  const dist = levenshtein(targetWords, saidWords);
  const maxLen = Math.max(targetWords.length, saidWords.length);
  const accuracy = Math.max(0, (1 - dist / maxLen) * 100);
  return Math.round(accuracy);
}

export function exactMatch(target, said) {
  return normalize(target) === normalize(said);
}

// 正解に含まれる単語のうち、入力に含まれていない単語だけを返す（ヒント表示用）。
// 大文字・小文字や記号の違いは無視して判定し、表示は正解内の元の表記（記号は除く）を使う。
export function missingWords(target, said) {
  const saidSet = new Set(normalize(said).split(" ").filter(Boolean));
  const originalWords = target.trim().split(/\s+/).filter(Boolean);
  const seen = new Set();
  const missing = [];
  for (const w of originalWords) {
    const norm = normalize(w);
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    if (!saidSet.has(norm)) missing.push(w.replace(/^[.,!?'";:]+|[.,!?'";:]+$/g, ""));
  }
  return missing;
}

// 単語の「有無」だけを見る一致度判定（語順は問わない）。
// 音声認識の結果は語順が乱れがちなため、シャドーイング・発話チェックではこちらを使う。
// 戻り値: { detail: [{word, matched}], matchedCount, total, ratio(0-100) }
export function wordMatchDetail(target, said) {
  const targetWords = normalize(target).split(" ").filter(Boolean);
  const saidWords = new Set(normalize(said).split(" ").filter(Boolean));
  const detail = targetWords.map((w) => ({ word: w, matched: saidWords.has(w) }));
  const matchedCount = detail.filter((d) => d.matched).length;
  const ratio = targetWords.length > 0 ? Math.round((matchedCount / targetWords.length) * 100) : 0;
  return { detail, matchedCount, total: targetWords.length, ratio };
}

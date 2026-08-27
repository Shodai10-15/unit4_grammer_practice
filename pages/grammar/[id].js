import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";
import { getSession } from "../../lib/session";
import Quiz from "../../components/Quiz";
import TypedBlank from "../../components/TypedBlank";
import DictationShadowing from "../../components/DictationShadowing";
import TypeThenSpeak from "../../components/TypeThenSpeak";
import HelpButton from "../../components/HelpButton";

import Icon from "../../components/Icon";

const GRAMMAR_LABEL = {
  U4G1: "must / mustn't",
  U4G2: "have to / don't have to",
  U4G3: "動名詞（目的語）",
  U4G4: "動名詞（主語）",
};

const LISTENING_INSTRUCTIONS = {
  U4G1: "音声を聞いて、しなければならないのか・してはいけないのか選ぼう！",
  U4G2: "音声を聞いて、必要なのか・不要なのか選ぼう！",
  U4G3: "音声を聞いて、正しい意味を選ぼう！",
  U4G4: "音声を聞いて、何について話しているか選ぼう！",
};

const STEP1_SKILLS = [
  { key: "L", label: <><Icon name="headphones" /> Listening</>, desc: "音声を聞いて選ぶ" },
  { key: "R", label: <><Icon name="book" /> Reading</>, desc: "読んで意味を選ぶ" },
  { key: "W", label: <><Icon name="pencil" /> Writing</>, desc: "穴埋めをタイプする" },
];

const STEP2_SKILLS = [
  { key: "S", label: <><Icon name="headphones" /><Icon name="mic" /> ディクテーション＆シャドーイング</>, desc: "書き取って→音読する" },
  { key: "W", label: <><Icon name="pencil" /><Icon name="mic" /> 英作文→発話</>, desc: "書いて→日本語だけ見て話す" },
];

export default function GrammarPage() {
  const router = useRouter();
  const { id: grammar } = router.query;
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState([]);
  const [mode, setMode] = useState(null); // {step, skill} or null = menu
  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [result, setResult] = useState(null); // {score,total}

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  useEffect(() => {
    if (session && grammar) loadProgress();
  }, [session, grammar]);

  async function loadProgress() {
    if (!supabase) return;
    const { data } = await supabase
      .from("progress")
      .select("*")
      .eq("seat_number", session.seatNumber)
      .eq("grammar", grammar);
    setProgress(data || []);
  }

  function statusOf(step, skill) {
    const row = progress.find(
      (r) => r.step === step && (skill ? r.skill === skill : true) && r.status === "passed"
    );
    return row ? "passed" : "none";
  }

  const unlockedStep1 = progress.some((r) => r.step === 0 && r.skill === "S1" && r.status === "passed");
  const unlockedStep2 = progress.some((r) => r.step === 0 && r.skill === "S2" && r.status === "passed");
  const unlockedStep3 = progress.some((r) => r.step === 0 && r.skill === "S3" && r.status === "passed");
  const step1Done = progress.some((r) => r.step === 1 && r.status === "passed");
  const step2Done = progress.some((r) => r.step === 2 && r.status === "passed");
  const step3Done = progress.some((r) => r.step === 3 && r.status === "passed");

  async function startQuiz(step, skill) {
    setLoadingQ(true);
    setResult(null);
    const { data } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("grammar", grammar)
      .eq("step", step)
      .eq("skill", skill)
      .order("sort_order");
    setQuestions(data || []);
    setMode({ step, skill });
    setLoadingQ(false);
  }

  async function saveProgress(step, skill, status, score, total, answerText) {
    if (!supabase) return;
    await supabase.from("progress").upsert(
      {
        seat_number: session.seatNumber,
        grammar,
        step,
        skill: skill || null,
        status,
        score: score ?? null,
        total: total ?? null,
        answer_text: answerText ?? null,
        attempts: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "seat_number,grammar,step,skill" }
    );
    loadProgress();
  }

  async function handleQuizFinish(score, total) {
    const { step, skill } = mode;
    setResult({ score, total });
    // Step1・Step2ともに満点（100%）で合格。届かなければ再挑戦を促す。
    const passLine = score === total;
    await saveProgress(step, skill, passLine ? "passed" : "in_progress", score, total);
  }

  function backToMenu() {
    setMode(null);
    setQuestions([]);
    setResult(null);
  }

  if (!session || !grammar) return null;

  if (!unlockedStep1) {
    return (
      <div className="page">
        <div className="header">
          <h1>
            {grammar}　{GRAMMAR_LABEL[grammar]}
          </h1>
          <button className="btn secondary" onClick={() => router.push("/select")}>
            一覧へ
          </button>
        </div>
        <UnlockGate
          grammar={grammar}
          step={1}
          onUnlocked={async () => {
            await saveProgress(0, "S1", "passed");
          }}
        />
      </div>
    );
  }

  const isStep1Writing = mode && mode.step === 1 && mode.skill === "W";
  const isStep1Choice = mode && mode.step === 1 && (mode.skill === "L" || mode.skill === "R");
  const isStep2Dictation = mode && mode.step === 2 && mode.skill === "S";
  const isStep2TypeSpeak = mode && mode.step === 2 && mode.skill === "W";

  // Step2 W（英作文→発話）用に question/correct を japanese/english の形へ詰め替える
  const typeSpeakQuestions = questions.map((q) => ({
    id: q.id,
    japanese: q.question,
    english: q.correct,
  }));

  return (
    <div className="page">
      <div className="header">
        <h1>
          {grammar}　{GRAMMAR_LABEL[grammar]}
        </h1>
        <button className="btn secondary" onClick={() => router.push("/select")}>
          一覧へ
        </button>
      </div>

      {!mode && (
        <>
          <div className="card">
            <p className="section-title">Step1　理解</p>
            <p className="muted">好きな技能を1つ以上選んで取り組もう（満点で合格）</p>
            <div className="grid">
              {STEP1_SKILLS.map((s) => (
                <div
                  key={s.key}
                  className="tile"
                  onClick={() => startQuiz(1, s.key)}
                >
                  <div>{s.label}</div>
                  <div className="muted">{s.desc}</div>
                  <div className={`badge ${statusOf(1, s.key) === "passed" ? "passed" : "none"}`}>
                    {statusOf(1, s.key) === "passed" ? "完了" : "未"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="section-title">
              Step2　暗記・習熟（合格ライン）
            </p>
            {!step1Done && <p className="muted">先にStep1を1つ終えよう</p>}
            {step1Done && !unlockedStep2 && (
              <UnlockGate
                grammar={grammar}
                step={2}
                inline
                onUnlocked={async () => {
                  await saveProgress(0, "S2", "passed");
                }}
              />
            )}
            {step1Done && unlockedStep2 && (
              <>
                <p className="muted">満点・80%以上の一致で合格！何度でも挑戦しよう</p>
                <div className="grid">
                  {STEP2_SKILLS.map((s) => (
                    <div
                      key={s.key}
                      className="tile"
                      onClick={() => startQuiz(2, s.key)}
                    >
                      <div>{s.label}</div>
                      <div className="muted">{s.desc}</div>
                      <div className={`badge ${statusOf(2, s.key) === "passed" ? "passed" : "none"}`}>
                        {statusOf(2, s.key) === "passed" ? "合格" : "未"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <p className="section-title">
              Step3　応用（ALTの先生に伝えよう）
            </p>
            {!step2Done && <p className="muted">先にStep2の合格が必要です</p>}
            {step2Done && !unlockedStep3 && (
              <UnlockGate
                grammar={grammar}
                step={3}
                inline
                onUnlocked={async () => {
                  await saveProgress(0, "S3", "passed");
                }}
              />
            )}
            {step2Done && unlockedStep3 && (
              <div
                className="tile"
                style={{ maxWidth: 260 }}
                onClick={() => setMode({ step: 3 })}
              >
                <div><Icon name="sparkles" /> 応用問題へ</div>
                <div className={`badge ${step3Done ? "passed" : "none"}`}>
                  {step3Done ? "提出済み" : "未提出"}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mode && mode.step !== 3 && !result && loadingQ && <p>読み込み中...</p>}

      {isStep1Choice && questions.length > 0 && !result && (
        <Quiz
          questions={questions}
          onFinish={handleQuizFinish}
          audioMode={mode.skill === "L"}
          instructionText={LISTENING_INSTRUCTIONS[grammar]}
        />
      )}

      {isStep1Writing && questions.length > 0 && !result && (
        <TypedBlank questions={questions} onFinish={handleQuizFinish} />
      )}

      {isStep2Dictation && questions.length > 0 && !result && (
        <DictationShadowing questions={questions} onFinish={handleQuizFinish} />
      )}

      {isStep2TypeSpeak && questions.length > 0 && !result && (
        <TypeThenSpeak questions={typeSpeakQuestions} onFinish={handleQuizFinish} />
      )}

      {mode && mode.step === 3 && (
        <div className="card">
          <p className="section-title">準備中</p>
          <p className="muted">
            Step3（応用課題）はまだ準備中です。内容が決まり次第、追加されます。
          </p>
          <button className="btn secondary" onClick={backToMenu}>
            メニューに戻る
          </button>
        </div>
      )}

      {result && result.total !== undefined && (
        <div className="card">
          <p style={{ fontSize: 18 }}>
            結果：{result.score} / {result.total} 問正解
          </p>
          {mode.step !== 3 && result.score !== result.total && (
            <p style={{ color: "#c0392b" }}>
              まだ合格ラインに届いていません。もう一度挑戦してみよう！
            </p>
          )}
          <div className="btn-row">
            {mode.step !== 3 && result.score !== result.total && (
              <button className="btn" onClick={() => startQuiz(mode.step, mode.skill)}>
                もう一度挑戦する
              </button>
            )}
            <button className="btn secondary" onClick={backToMenu}>
              メニューに戻る
            </button>
          </div>
        </div>
      )}

      {result && result.done && (
        <div className="card">
          <p>提出しました！お疲れさまでした。</p>
          <button className="btn secondary" onClick={backToMenu}>
            メニューに戻る
          </button>
        </div>
      )}

      <HelpButton
        seatNumber={session.seatNumber}
        grammar={grammar}
        step={mode ? mode.step : 0}
      />
    </div>
  );
}

const STEP3_CONFIG = {
  G1: {
    title: "わたしの説明書",
    themeHint: "好きなこと・得意なことを1つ決めよう（部活、趣味、ペット、ゲームなど）",
    frames: [
      "I know how to ___.",
      "I don't know what to ___.",
      "Do you know where to ___?",
      "I wonder who to ___.",
      "Please remember when to ___.",
    ],
    guiding: [
      "なぜ好き・得意なの？",
      "いつから始めた？",
      "どんなエピソードがある？",
      "これからどうしたい？",
    ],
    example:
      "I like basketball. I know how to shoot well. I don't know what to do when I miss. I practice every day.",
  },
  G2: {
    title: "先輩からのアドバイスカード",
    themeHint: "後輩（1年生など）にアドバイスするつもりでテーマを1つ決めよう",
    frames: [
      "I'll show you how to ___.",
      "I'll tell you what to ___ when ___.",
      "Can you teach me where to ___?",
      "My friend showed me who to ___.",
      "I'll teach you when to ___.",
    ],
    guiding: [
      "何が得意で教えたいの？",
      "いつ困る場面が多い？",
      "自分も最初は苦労した？",
      "どんな気持ちで伝えたい？",
    ],
    example:
      "I'm good at cooking. I'll show you how to cut vegetables. I'll tell you what to do when the pan is hot. Cooking is fun for me.",
  },
};

const COPILOT_PROMPT = `あなたは中学2年生の英語学習をサポートするアシスタントです。
以下の英文について、文法的な間違いがあれば指摘し、より自然な表現があれば提案してください。
ただし、書き直した文章は私に伝えるだけにして、あなたが直接答えを完成させないでください。
英文：（ここに自分の文章を貼る）`;

function UnlockGate({ grammar, step, onUnlocked, inline }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function submit() {
    if (!code.trim()) {
      setError("合言葉を入力しよう");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grammar, step, code: code.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "合言葉が違います");
        setChecking(false);
        return;
      }
      await onUnlocked();
    } catch {
      setError("通信エラーが発生しました");
      setChecking(false);
    }
  }

  const content = (
    <>
      <p className="section-title">🔒 Step{step}の合言葉</p>
      <p className="muted">
        ワークシートのStep{step}部分に取り組み、そこで分かる合言葉を入力してから進もう。
      </p>
      <input
        type="text"
        placeholder="合言葉を入力"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      {error && <p style={{ color: "var(--danger, #c0392b)", fontSize: 13 }}>{error}</p>}
      <button className="btn" onClick={submit} disabled={checking}>
        {checking ? "確認中..." : "進む"}
      </button>
    </>
  );

  if (inline) return <div>{content}</div>;
  return <div className="card">{content}</div>;
}

function Step3Form({ grammar, onSubmit }) {
  const config = STEP3_CONFIG[grammar];
  const [theme, setTheme] = useState("");
  const [draft, setDraft] = useState("");
  const [usedCopilot, setUsedCopilot] = useState(false);
  const [revised, setRevised] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = theme.trim() && draft.trim() && (!usedCopilot || revised.trim());

  return (
    <div className="card">
      <p className="section-title" style={{ fontSize: 22 }}>{config.title}</p>
      <p className="muted">{config.themeHint}</p>

      <label>テーマ</label>
      <input
        type="text"
        placeholder="例：バスケットボール、料理、飼っているねこ"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
      />

      <div
        style={{
          background: "var(--bg-accent, #eaf4f2)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
        }}
      >
        <p className="section-title" style={{ fontSize: 16 }}>使える型（2つ以上使おう）</p>
        {config.frames.map((f, i) => (
          <p key={i} style={{ margin: "2px 0", fontFamily: "monospace" }}>
            ・{f}
          </p>
        ))}
      </div>

      <div
        style={{
          background: "#fdf1dc",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
        }}
      >
        <p className="section-title" style={{ fontSize: 16 }}>
          💡 何を書けばいいか迷ったら（ヒント・書かなくてもOK）
        </p>
        {config.guiding.map((g, i) => (
          <p key={i} style={{ margin: "2px 0" }}>
            ・{g}
          </p>
        ))}
      </div>

      <p className="muted">例（3〜4文）：{config.example}</p>

      <label>下書き（3〜4文）</label>
      <textarea
        rows={4}
        style={{ width: "100%", padding: 12, fontSize: 15, borderRadius: 8, border: "1px solid #d3dde0", marginBottom: 12 }}
        placeholder="ここに自分の文章を書こう"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />

      <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={usedCopilot}
          onChange={(e) => setUsedCopilot(e.target.checked)}
          style={{ width: 20, height: 20 }}
        />
        Copilotに相談して改善した
      </label>

      {usedCopilot && (
        <>
          <div
            style={{
              background: "#f4f7f6",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 8,
              fontSize: 13,
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
            }}
          >
            {COPILOT_PROMPT}
          </div>
          <label>改善後の文章</label>
          <textarea
            rows={4}
            style={{ width: "100%", padding: 12, fontSize: 15, borderRadius: 8, border: "1px solid #d3dde0", marginBottom: 12 }}
            placeholder="Copilotに相談したあとの文章を貼ろう"
            value={revised}
            onChange={(e) => setRevised(e.target.value)}
          />
        </>
      )}

      <button
        className="btn"
        disabled={!canSubmit || submitting}
        onClick={async () => {
          setSubmitting(true);
          const parts = [
            `[テーマ] ${theme.trim()}`,
            `[下書き]\n${draft.trim()}`,
          ];
          if (usedCopilot && revised.trim()) {
            parts.push(`[Copilot改善後]\n${revised.trim()}`);
          }
          await onSubmit(parts.join("\n\n"));
          setSubmitting(false);
        }}
      >
        提出する
      </button>
    </div>
  );
}

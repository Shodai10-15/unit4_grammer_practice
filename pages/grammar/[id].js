import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";
import { getSession } from "../../lib/session";
import Quiz from "../../components/Quiz";
import TypedBlank from "../../components/TypedBlank";
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
  { key: "R", label: <><Icon name="book" /> Reading</>, desc: "読んで意味を選ぶ" },
  { key: "W", label: <><Icon name="pencil" /> Writing</>, desc: "穴埋めをタイプする" },
];

const STEP2_SKILLS = [
  { key: "W", label: <><Icon name="pencil" /> 英作文スピードライティング</>, desc: "書いて→日本語だけ見て20秒でもう一度書く" },
];

// 紙のワークシートの答え合わせ（アプリ内でその場で確認できる版）。
// ワークシートが「土台」であることは変わらないので、内容そのものはワークシートの答えのみ。
const ANSWER_CHECK_CONFIG = {
  U4G1: {
    step1: {
      title: "Step1　ワークシートの答え合わせ",
      sections: [
        {
          label: "① Reading（すべて A）",
          items: [
            { a: "A", note: "「〜しなければならない／してはいけない」の意味を選ぶ問題。本文中のmust/mustn'tの形をチェックしよう。" },
          ],
        },
        {
          label: "② Writing",
          items: [
            { a: "① recycle → must", note: "「〜しなければならない」なのでmust。" },
            { a: "② swim → mustn't", note: "「〜してはいけない」なのでmustn't。" },
            { a: "③ keep your promise → must", note: "「約束を守らなければならない」なのでmust。" },
            { a: "④ leave trash → mustn't", note: "「ゴミを置いていってはいけない」なのでmustn't。" },
            { a: "⑤ be kind → must", note: "「親切にしなければならない」なのでmust。" },
          ],
        },
      ],
    },
    step2: {
      title: "Step2　ワークシートの答え合わせ",
      sections: [
        {
          label: "① 英作文",
          items: [
            { a: "① I must get up at six every morning.", note: "「〜しなければならない」＝must＋動詞の原形。" },
            { a: "② You mustn't take pictures here.", note: "「〜してはいけない」＝mustn't＋動詞の原形。" },
            { a: "③ We mustn't run in the hallway.", note: "主語がWeでもmustn'tの形は変わらない。" },
            { a: "④ He must return this book today.", note: "主語が三人称でもmustはそのままmust。" },
            { a: "⑤ You mustn't use your phone during class.", note: "「授業中は〜してはいけない」＝mustn't。" },
          ],
        },
        {
          label: "② ディクテーション",
          items: [{ a: "（音声の通り正しく書けていればOK）", note: "must / mustn'tの聞き取りがポイント。mustn'tは「マスントゥ」と聞こえるよ。" }],
        },
      ],
    },
  },
};

function AnswerCheckPanel({ config }) {
  const [open, setOpen] = useState(false);
  if (!config) return null;
  return (
    <div className="card">
      <p className="section-title">📖 紙のワークシートの答え合わせ</p>
      <p className="muted">
        ワークシートで解いた問題の答えをここで確認できるよ（ワークシートが基本！まずは自分で解いてから見よう）
      </p>
      <button className="btn secondary" onClick={() => setOpen((o) => !o)}>
        {open ? "答え合わせを閉じる" : "答え合わせを見る"}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {["step1", "step2"].map((key) =>
            config[key] ? (
              <div key={key} style={{ marginBottom: 12 }}>
                <p className="section-title" style={{ fontSize: 16 }}>
                  {config[key].title}
                </p>
                {config[key].sections.map((sec, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <p style={{ fontWeight: "bold", margin: "4px 0" }}>{sec.label}</p>
                    {sec.items.map((it, j) => (
                      <div key={j} style={{ marginBottom: 4 }}>
                        <p style={{ margin: "2px 0" }}>{it.a}</p>
                        {it.note && (
                          <p className="muted" style={{ fontSize: 13, margin: "0 0 4px 0" }}>
                            💡 {it.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

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

  const isStep1Writing = mode && mode.step === 1 && mode.skill === "W";
  const isStep1Choice = mode && mode.step === 1 && (mode.skill === "L" || mode.skill === "R");
  // Step2（暗記・習熟）とStep2.5（追加の英作文チャレンジ）は同じUIを使う
  const isStep2TypeSpeak = mode && (mode.step === 2 || mode.step === 25) && mode.skill === "W";

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
          <AnswerCheckPanel config={ANSWER_CHECK_CONFIG[grammar]} />

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
            {step1Done && (
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
              Step2.5　もっと英作文（やりたかったら取り組もう）
            </p>
            {!step2Done && <p className="muted">先にStep2の合格が必要です</p>}
            {step2Done && (
              <>
                <p className="muted">ワークシートにない新しい問題にチャレンジできるよ（任意）</p>
                <div
                  className="tile"
                  style={{ maxWidth: 260 }}
                  onClick={() => startQuiz(25, "W")}
                >
                  <div><Icon name="pencil" /> 追加の英作文チャレンジ</div>
                  <div className="muted">書いて→日本語だけ見て20秒でもう一度書く</div>
                  <div className={`badge ${statusOf(25, "W") === "passed" ? "passed" : "none"}`}>
                    {statusOf(25, "W") === "passed" ? "合格" : "未"}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="card">
            <p className="section-title">
              Step3　応用（ALTの先生に伝えよう）
            </p>
            {!step2Done && <p className="muted">先にStep2の合格が必要です</p>}
            {step2Done && (
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

      {isStep2TypeSpeak && questions.length > 0 && !result && (
        <TypeThenSpeak questions={typeSpeakQuestions} onFinish={handleQuizFinish} />
      )}

      {mode && mode.step === 3 && !result && STEP3_CONFIG[grammar] && (
        <RulesTask
          config={STEP3_CONFIG[grammar]}
          onSubmit={async (text) => {
            await saveProgress(3, null, "passed", null, null, text);
            setResult({ done: true });
          }}
        />
      )}

      {mode && mode.step === 3 && !STEP3_CONFIG[grammar] && (
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
  U4G1: {
    title: "理想の学校ルールメーカー",
    instruction:
      "「これがあったらもっと過ごしやすいのに」という学校・クラスのルールを、must / mustn'tを使って5つ考えて英語で書こう。",
    wordBank: [
      "be quiet",
      "be on time",
      "bring your textbook",
      "do your homework",
      "wear the school uniform",
      "use your phone in class",
      "run in the hallway",
      "eat in the classroom",
      "help each other",
      "clean the classroom",
      "talk during a test",
      "take pictures without asking",
    ],
    example:
      "Students must help each other. Students mustn't use their phones in class.",
  },
};

function RulesTask({ config, onSubmit }) {
  const [rules, setRules] = useState(["", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);

  function updateRule(i, val) {
    const next = [...rules];
    next[i] = val;
    setRules(next);
  }

  const filledCount = rules.filter((r) => r.trim()).length;
  const canSubmit = filledCount >= 5;

  return (
    <div className="card">
      <p className="section-title" style={{ fontSize: 22 }}>{config.title}</p>
      <p className="muted">{config.instruction}</p>

      <div
        style={{
          background: "var(--bg-accent, #eaf4f2)",
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
        }}
      >
        <p className="section-title" style={{ fontSize: 16 }}>
          使える単語・表現（ワークシートと同じもの）
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {config.wordBank.map((w, i) => (
            <span
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #cfe0dd",
                borderRadius: 999,
                padding: "3px 10px",
                fontSize: 13,
              }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      <p className="muted">例：{config.example}</p>

      <label>あなたが考える理想の学校・クラスのルールを5つ、英語で書こう</label>
      {rules.map((r, i) => (
        <input
          key={i}
          type="text"
          placeholder={`${i + 1}. 例：Students must ...`}
          value={r}
          onChange={(e) => updateRule(i, e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 15,
            borderRadius: 8,
            border: "1px solid #d3dde0",
            marginBottom: 8,
          }}
        />
      ))}
      <p className="muted" style={{ fontSize: 13 }}>{filledCount} / 5 個 入力済み</p>

      <button
        className="btn"
        disabled={!canSubmit || submitting}
        onClick={async () => {
          setSubmitting(true);
          const text = rules.map((r, i) => `${i + 1}. ${r.trim()}`).join("\n");
          await onSubmit(text);
          setSubmitting(false);
        }}
      >
        提出する
      </button>
    </div>
  );
}

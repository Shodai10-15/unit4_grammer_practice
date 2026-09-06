import { useRouter } from "next/router";

const SETS = {
  "g1-step1-answers": {
    title: "G1 Step1　こたえ合わせ",
    code: "SCHOOLRULE1",
    sections: [
      { label: "① Reading", lines: ["① A", "② A", "③ A", "④ A"] },
      { label: "② Writing", lines: ["① must", "② mustn't", "③ must", "④ mustn't", "⑤ must"] },
    ],
  },
  "g2-step1-answers": {
    title: "G2 Step1　こたえ合わせ",
    sections: [
      { label: "① Listening", lines: ["① 掃除", "② 宿題", "③ 買い物", "④ 練習", "⑤ 会議"] },
      { label: "② Reading", lines: ["① A", "② A", "③ A", "④ A"] },
      { label: "③ Writing", lines: ["① have to", "② don't have to", "③ has to", "④ don't have to", "⑤ has to"] },
    ],
  },
  "g3-step1-answers": {
    title: "G3 Step1　こたえ合わせ",
    sections: [
      { label: "① Listening", lines: ["① サッカー", "② 掃除", "③ ピアノ", "④ 宿題", "⑤ テレビ"] },
      { label: "② Reading", lines: ["① A", "② A", "③ A", "④ A"] },
      { label: "③ Writing", lines: ["① playing", "② cleaning", "③ speaking", "④ watching", "⑤ learning"] },
    ],
  },
  "g4-step1-answers": {
    title: "G4 Step1　こたえ合わせ",
    sections: [
      { label: "① Listening", lines: ["① サッカー", "② 読書", "③ 料理", "④ 水泳", "⑤ ピアノ"] },
      { label: "② Reading", lines: ["① A", "② A", "③ A", "④ A"] },
      { label: "③ Writing", lines: ["① Swimming", "② Reading", "③ Cooking", "④ Playing", "⑤ Speaking"] },
    ],
  },
  "g1-step2-answers": {
    title: "G1 Step2　こたえ合わせ",
    code: "SCHOOLRULE2",
    sections: [
      {
        label: "① 英作文",
        lines: [
          "① I must get up at six every morning.",
          "② You mustn't take pictures here.",
          "③ We mustn't run in the hallway.",
          "④ He must return this book today.",
          "⑤ You mustn't use your phone during class.",
        ],
      },
      {
        label: "② ディクテーション",
        lines: [
          "① You must wear a helmet when you ride a bike.",
          "② You mustn't swim in this river.",
          "③ We must be quiet in the library.",
          "④ You mustn't touch the paintings.",
          "⑤ I must finish this report by Friday.",
        ],
      },
    ],
  },
  "g2-step2-answers": {
    title: "G2 Step2　こたえ合わせ",
    sections: [
      {
        label: "① 英作文",
        lines: [
          "① I have to wash the dishes every day.",
          "② You don't have to worry about the test.",
          "③ He has to get up early tomorrow.",
          "④ We don't have to buy a new one.",
          "⑤ She has to finish this by Friday.",
        ],
      },
      {
        label: "② ディクテーション",
        lines: [
          "① I have to wash the dishes after dinner.",
          "② You don't have to worry about the test.",
          "③ He has to get up early tomorrow.",
          "④ We don't have to buy a new one.",
          "⑤ She has to finish this by Friday.",
        ],
      },
    ],
  },
  "g3-step2-answers": {
    title: "G3 Step2　こたえ合わせ",
    sections: [
      {
        label: "① 英作文",
        lines: [
          "① I enjoy playing the guitar.",
          "② She finished cleaning the kitchen.",
          "③ He practices speaking English every day.",
          "④ We stopped watching TV and went to bed.",
          "⑤ My sister gave up learning the violin.",
        ],
      },
      {
        label: "② ディクテーション",
        lines: [
          "① I enjoy playing basketball with my classmates.",
          "② He finished washing the car.",
          "③ She practices singing every weekend.",
          "④ They stopped talking and started listening.",
          "⑤ My brother gave up playing soccer.",
        ],
      },
    ],
  },
  "g4-step2-answers": {
    title: "G4 Step2　こたえ合わせ",
    sections: [
      {
        label: "① 英作文",
        lines: [
          "① Playing soccer is fun.",
          "② Reading books is interesting to me.",
          "③ Cooking dinner every night is hard work.",
          "④ Playing video games is fun for kids.",
          "⑤ Speaking English fluently takes time.",
        ],
      },
      {
        label: "② ディクテーション",
        lines: [
          "① Playing tennis is good exercise.",
          "② Watching movies is fun on weekends.",
          "③ Cleaning the house takes a long time.",
          "④ Singing songs makes me happy.",
          "⑤ Learning new things is exciting.",
        ],
      },
    ],
  },
  "g1-step3-code": {
    title: "G1 Step3　解放コード",
    code: "BONUS1",
  },
};

export default function AnswerPage() {
  const router = useRouter();
  const { slug } = router.query;
  const set = slug ? SETS[slug] : null;

  if (!slug) return null;
  if (!set) {
    return (
      <div className="page">
        <div className="header">
          <h1>こたえが見つかりません</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <h1>{set.title}</h1>
      </div>
      {(set.sections || []).map((sec, i) => (
        <div className="card" key={i}>
          <p className="section-title">{sec.label}</p>
          {sec.lines.map((l, j) => (
            <p key={j} style={{ fontSize: 16, margin: "4px 0" }}>
              {l}
            </p>
          ))}
        </div>
      ))}
      {set.code && (
        <div
          className="card"
          style={{ background: "#eaf4f2", border: "1px solid #cfe0dd" }}
        >
          <p className="section-title">OKだったら、この合言葉をアプリに入力しよう</p>
          <p style={{ fontSize: 26, fontWeight: "bold", color: "#c0392b", margin: "6px 0 0" }}>
            {set.code}
          </p>
        </div>
      )}
    </div>
  );
}

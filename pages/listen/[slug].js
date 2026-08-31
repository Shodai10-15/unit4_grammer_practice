import { useRouter } from "next/router";
import AudioPlayer from "../../components/AudioPlayer";

// ワークシートのQRコードから飛んでくる、音声再生専用ページ。
// hidden: 英文を表示しない（ディクテーション・リスニング用）
// visible: 英文を表示する（発音確認用）
const SETS = {
  "g1-step1": {
    title: "G1 Step1　リスニング",
    hidden: true,
    items: [
      "You must be quiet in the library.",
      "You must wear a swimming cap in the pool.",
      "You must not eat food in the classroom.",
      "You must show your ticket at the station.",
      "You must not run in the gym.",
    ],
  },
  "g2-step1": {
    title: "G2 Step1　リスニング",
    hidden: true,
    items: [
      "I have to clean my room today.",
      "She doesn't have to do her homework tonight.",
      "We have to go shopping this afternoon.",
      "He doesn't have to practice soccer today.",
      "They have to attend the meeting tomorrow.",
    ],
  },
  "g3-step1": {
    title: "G3 Step1　リスニング",
    hidden: true,
    items: [
      "I enjoy playing soccer with my friends.",
      "She finished cleaning her room.",
      "He practices playing the piano every day.",
      "My brother stopped doing his homework and went to bed.",
      "We should stop watching TV and start studying.",
    ],
  },
  "g4-step1": {
    title: "G4 Step1　リスニング",
    hidden: true,
    items: [
      "Playing soccer is a lot of fun.",
      "Reading books is very interesting to me.",
      "Cooking dinner is not easy for beginners.",
      "Swimming in the sea is exciting.",
      "Playing the piano is relaxing for her.",
    ],
  },
  "g1-step2-dictation": {
    title: "G1 Step2　ディクテーション",
    hidden: true,
    items: [
      "You must wear a helmet when you ride a bike.",
      "You mustn't swim in this river.",
      "We must be quiet in the library.",
      "You mustn't touch the paintings.",
      "I must finish this report by Friday.",
    ],
  },
  "g2-step2-dictation": {
    title: "G2 Step2　ディクテーション",
    hidden: true,
    items: [
      "I have to wash the dishes after dinner.",
      "You don't have to worry about the test.",
      "He has to get up early tomorrow.",
      "We don't have to buy a new one.",
      "She has to finish this by Friday.",
    ],
  },
  "g3-step2-dictation": {
    title: "G3 Step2　ディクテーション",
    hidden: true,
    items: [
      "I enjoy playing basketball with my classmates.",
      "He finished washing the car.",
      "She practices singing every weekend.",
      "They stopped talking and started listening.",
      "My brother gave up playing soccer.",
    ],
  },
  "g4-step2-dictation": {
    title: "G4 Step2　ディクテーション",
    hidden: true,
    items: [
      "Playing tennis is good exercise.",
      "Watching movies is fun on weekends.",
      "Cleaning the house takes a long time.",
      "Singing songs makes me happy.",
      "Learning new things is exciting.",
    ],
  },
  "g1-step2-pronounce": {
    title: "G1 Step2　発音確認",
    hidden: false,
    items: [
      "You must wear a helmet when you ride a bike.",
      "You mustn't swim in this river.",
      "We must be quiet in the library.",
      "You mustn't touch the paintings.",
      "I must finish this report by Friday.",
    ],
  },
  "g2-step2-pronounce": {
    title: "G2 Step2　発音確認",
    hidden: false,
    items: [
      "I have to wash the dishes after dinner.",
      "You don't have to worry about the test.",
      "He has to get up early tomorrow.",
      "We don't have to buy a new one.",
      "She has to finish this by Friday.",
    ],
  },
  "g3-step2-pronounce": {
    title: "G3 Step2　発音確認",
    hidden: false,
    items: [
      "I enjoy playing the guitar.",
      "She finished cleaning the kitchen.",
      "He practices speaking English every day.",
      "We stopped watching TV and went to bed.",
      "My sister gave up learning the violin.",
    ],
  },
  "g4-step2-pronounce": {
    title: "G4 Step2　発音確認",
    hidden: false,
    items: [
      "Playing soccer is fun.",
      "Reading books is interesting to me.",
      "Cooking dinner every night is hard work.",
      "Playing video games is fun for kids.",
      "Speaking English fluently takes time.",
    ],
  },
};

export default function ListenPage() {
  const router = useRouter();
  const { slug } = router.query;
  const set = slug ? SETS[slug] : null;

  if (!slug) return null;
  if (!set) {
    return (
      <div className="page">
        <div className="header">
          <h1>音声が見つかりません</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="header">
        <h1>{set.title}</h1>
      </div>
      {set.items.map((text, i) => (
        <div className="card" key={i}>
          <p className="muted">問題 {i + 1}</p>
          <AudioPlayer text={text} />
          {!set.hidden && (
            <p style={{ fontSize: 18, fontWeight: "bold", marginTop: 12 }}>{text}</p>
          )}
        </div>
      ))}
    </div>
  );
}

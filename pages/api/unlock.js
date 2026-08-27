import { supabaseAdmin } from "../../lib/supabaseAdmin";

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase未接続です（環境変数を確認してください）" });
    return;
  }
  const { grammar, step, code } = req.body || {};
  if (!grammar || !step || !code) {
    res.status(400).json({ ok: false, error: "合言葉を入力してください" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("unlock_codes")
    .select("code")
    .eq("grammar", grammar)
    .eq("step", step)
    .single();

  if (error || !data) {
    res.status(200).json({ ok: false, error: "この授業回の合言葉が設定されていません" });
    return;
  }

  if (normalize(data.code) !== normalize(code)) {
    res.status(200).json({ ok: false, error: "合言葉が違います" });
    return;
  }

  res.status(200).json({ ok: true });
}

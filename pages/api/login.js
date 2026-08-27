import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase未接続です（環境変数を確認してください）" });
    return;
  }
  const { seatNumber, password } = req.body || {};
  if (!seatNumber || !password) {
    res.status(400).json({ ok: false, error: "出席番号とパスワードを入力してください" });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("seat_number, name, password")
    .eq("seat_number", seatNumber)
    .single();

  if (error || !data) {
    res.status(200).json({ ok: false, error: "出席番号が見つかりません" });
    return;
  }

  if (String(data.password) !== String(password)) {
    res.status(200).json({ ok: false, error: "パスワードが違います" });
    return;
  }

  res.status(200).json({ ok: true, name: data.name });
}

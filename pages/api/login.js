import { supabaseAdmin } from "../../lib/supabaseAdmin";

function isFourDigits(pw) {
  return /^\d{4}$/.test(String(pw || "").trim());
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
  const { seatNumber, password } = req.body || {};
  if (!seatNumber || !password) {
    res.status(400).json({ ok: false, error: "出席番号とパスワードを入力してください" });
    return;
  }
  if (!isFourDigits(password)) {
    res.status(200).json({ ok: false, error: "パスワードは4桁の数字で入力してください" });
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

  const trimmed = String(password).trim();

  if (!data.password) {
    // 初回ログイン：先生が事前に設定したパスワードはない。
    // 入力された4桁の数字を、これ以降このアカウントのパスワードとして登録する。
    const { error: updateError } = await supabaseAdmin
      .from("students")
      .update({ password: trimmed })
      .eq("seat_number", seatNumber);
    if (updateError) {
      res.status(500).json({ ok: false, error: "登録に失敗しました。もう一度お試しください" });
      return;
    }
    res.status(200).json({ ok: true, name: data.name, registered: true });
    return;
  }

  if (String(data.password) !== trimmed) {
    res.status(200).json({ ok: false, error: "パスワードが違います" });
    return;
  }

  res.status(200).json({ ok: true, name: data.name });
}

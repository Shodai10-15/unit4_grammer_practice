import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { sortByClassAndNumber } from "../../lib/classUtils";

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase未接続です（環境変数を確認してください）" });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("seat_number, name");
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  // seat_number は "4-1" 形式の文字列なので、DB側の文字列ソートではなく
  // クラス→出席番号の数値順に並べ替える（"4-10" が "4-9" より前に来る問題を防ぐ）
  const sorted = sortByClassAndNumber(data, "seat_number");
  res.status(200).json({ students: sorted });
}

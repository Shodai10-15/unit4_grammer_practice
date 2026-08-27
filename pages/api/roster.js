import { supabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    res.status(500).json({ error: "Supabase未接続です（環境変数を確認してください）" });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from("students")
    .select("seat_number, name")
    .order("seat_number");
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(200).json({ students: data });
}

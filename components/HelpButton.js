import Icon from "./Icon";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// ヘルプの有効/解除は「授業回（grammar）ごと」に判定する。
// Stepをまたいで画面移動しても、同じヘルプとして正しく扱われるようにするため。
export default function HelpButton({ seatNumber, grammar, step }) {
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkActive();
  }, [seatNumber, grammar]);

  async function checkActive() {
    if (!supabase || !grammar) return;
    const { data, error } = await supabase
      .from("help_requests")
      .select("id")
      .eq("seat_number", seatNumber)
      .eq("grammar", grammar)
      .eq("resolved", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      console.error("checkActive error", error);
      return;
    }
    setActiveId(data && data.length > 0 ? data[0].id : null);
  }

  async function requestHelp() {
    if (!supabase) {
      alert("Supabase未接続です（.env.localを設定してください）");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("help_requests")
      .insert({ seat_number: seatNumber, grammar, step: step || 0, resolved: false })
      .select()
      .single();
    if (error) {
      alert("ヘルプの送信に失敗しました: " + error.message);
    } else if (data) {
      setActiveId(data.id);
    }
    setLoading(false);
  }

  async function resolveHelp() {
    if (!supabase || !activeId) return;
    setLoading(true);
    const { error } = await supabase
      .from("help_requests")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", activeId);
    if (error) {
      alert("解除に失敗しました: " + error.message);
      setLoading(false);
      return;
    }
    setActiveId(null);
    setLoading(false);
  }

  if (activeId) {
    return (
      <button
        className="help-fab"
        style={{ background: "var(--ok, #2e8b57)" }}
        onClick={resolveHelp}
        disabled={loading}
      >
        <Icon name="hand" size={18} /> ヘルプを解除する
      </button>
    );
  }

  return (
    <button className="help-fab" onClick={requestHelp} disabled={loading}>
      <Icon name="hand" size={18} /> ヘルプ
    </button>
  );
}

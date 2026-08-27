import { createClient } from "@supabase/supabase-js";

// 重要: この値は NEXT_PUBLIC_ を付けていないため、ブラウザには一切送られません。
// pages/api/ 以下のサーバー側コードからのみ使用してください。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

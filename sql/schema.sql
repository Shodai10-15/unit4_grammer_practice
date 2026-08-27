-- Unit5 進捗確認クイズアプリ用スキーマ
-- Supabaseの SQL Editor にそのまま貼り付けて実行してください。

-- 生徒名簿（教師が事前に登録）
create table if not exists students (
  seat_number text primary key,   -- 出席番号（例: "01"）
  name text not null              -- 表示名（例: "山田太郎"）
);

-- 進捗（Step1〜3のクリア状況）
create table if not exists progress (
  id bigint generated always as identity primary key,
  seat_number text not null references students(seat_number),
  grammar text not null check (grammar in ('G1','G2','G3')),
  step int not null check (step in (1,2,3)),
  skill text,                     -- L/R/W/S（step3はnull可）
  status text not null default 'in_progress' check (status in ('in_progress','passed')),
  score int,                      -- 正解数
  total int,                      -- 問題数
  attempts int not null default 0,
  answer_text text,               -- Step3などの自由記述回答を残す欄
  updated_at timestamptz not null default now(),
  unique (seat_number, grammar, step, skill)
);

-- ヘルプ要請の履歴（毎回追記、上書きしない）
create table if not exists help_requests (
  id bigint generated always as identity primary key,
  seat_number text not null references students(seat_number),
  grammar text not null,
  step int not null,
  created_at timestamptz not null default now()
);

-- 確認問題データ（G1〜G3 Step1/2、L/R/W/S）
create table if not exists quiz_questions (
  id text primary key,            -- 例: "G1-L1"
  grammar text not null check (grammar in ('G1','G2','G3')),
  step int not null check (step in (1,2)),
  skill text not null check (skill in ('L','R','W','S')),
  qtype text not null,            -- 音声 / 問題文 / 穴埋め / 入れ替え / 音声＋リピート
  question text not null,
  choice_a text,
  choice_b text,
  choice_c text,
  choice_d text,
  correct text,                   -- A/B/C/D、Sタイプはnull
  note text,
  sort_order int not null default 0
);

-- RLS: 学習用の低リスクデータなので、匿名キーからの読み書きを許可する簡易設定。
-- より厳密にしたい場合は、seat_numberをJWTのclaimと突き合わせる形に後で変更してください。
alter table students enable row level security;
alter table progress enable row level security;
alter table help_requests enable row level security;
alter table quiz_questions enable row level security;

create policy "anon read students" on students for select using (true);
create policy "anon all progress" on progress for all using (true) with check (true);
create policy "anon all help_requests" on help_requests for all using (true) with check (true);
create policy "anon read quiz_questions" on quiz_questions for select using (true);

-- 生徒名簿のサンプル（実際の出席番号・氏名に差し替えてください）
-- insert into students (seat_number, name) values ('01','サンプル太郎'), ('02','サンプル花子');

-- ヘルプ解除ボタン対応（既存テーブルに列を追加）
alter table help_requests add column if not exists resolved boolean not null default false;
alter table help_requests add column if not exists resolved_at timestamptz;

-- 個別パスワード方式への変更
alter table students add column if not exists password text;

-- 生徒テーブルへの直接アクセス（anon経由）を塞ぐ。
-- 以降は必ずサーバー側API（service role key）経由でのみ読み書きする。
drop policy if exists "anon read students" on students;

-- ワークシート連動の合言葉機能
create table if not exists unlock_codes (
  grammar text primary key,
  code text not null
);
alter table unlock_codes enable row level security;
-- anonからは一切読み書きさせない（サーバー側APIのservice role経由のみでアクセスする）

-- progressテーブルのstep制約に0（ロック解除の記録用）を追加
alter table progress drop constraint if exists progress_step_check;
alter table progress add constraint progress_step_check check (step in (0,1,2,3));

-- 合言葉をStepごとに設定できるようにする（grammar単位→grammar+step単位に変更）
drop table if exists unlock_codes;
create table unlock_codes (
  grammar text not null,
  step int not null check (step in (1,2,3)),
  code text not null,
  primary key (grammar, step)
);
alter table unlock_codes enable row level security;
-- anonからは一切読み書きさせない（サーバー側APIのservice role経由のみでアクセスする）

-- Unit4用に文法チェック制約を変更
alter table quiz_questions drop constraint if exists quiz_questions_grammar_check;
alter table quiz_questions add constraint quiz_questions_grammar_check check (grammar in ('U4G1','U4G2','U4G3','U4G4'));
alter table progress drop constraint if exists progress_grammar_check;
-- progressテーブルにgrammarのCHECK制約が無ければ何もしない（元のスキーマにcheckは無いため通常は不要）

# Unit 4 進捗確認クイズアプリ（雛形）

U4G1〜U4G4（文法回）のStep1（理解）・Step2（習熟・合格ライン）・Step3（応用）を、
生徒が自分のペースで進められるWebアプリの雛形です。Supabase＋Next.js（Vercelにそのままデプロイ可能）。

## できること

- 出席番号＋クラス合言葉でログイン（メール機能を使わない、案3の方式）
- G1/G2/G3を選び、Step1（Listening/Reading/Writingから選択）→Step2（Speaking+音声リピート／Writingパターン練習、満点で合格）→Step3（ALTの先生向けの応用問題）と進める
- Step2は満点でないと合格にならず、再挑戦できる
- Step2合格まではStep3がロックされる
- 🙋ヘルプボタンで、いつでも「困っている」を記録できる（履歴として残る）
- `/teacher` に教師用ダッシュボード（合言葉で保護）。生徒×U4G1〜U4G4の進捗マトリクスと、ヘルプ要請の履歴をリアルタイムに近い形（15秒ごと自動更新）で確認できる

## セットアップ手順

### 1. Supabaseプロジェクトを作る

1. https://supabase.com で新規プロジェクトを作成（学校の組織アカウントでなくて構いません。個人のGoogle/GitHubアカウントで作成可）
2. プロジェクト内の「SQL Editor」で `sql/schema.sql` の中身を貼り付けて実行（テーブル作成）
3. 続けて `sql/seed_quiz_questions.sql` を貼り付けて実行（U4G1〜U4G4の問題データを流し込み）
4. 「Table Editor」→ `students` テーブルに、実際のクラスの出席番号・氏名を1行ずつ登録
   （`insert into students (seat_number, name) values ('01','山田太郎');` のようにSQL Editorから一括登録も可能）

### 2. 環境変数を設定する

`.env.local.example` を `.env.local` にコピーし、以下を埋める。

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`：Supabase管理画面の Settings > API から取得
- `NEXT_PUBLIC_CLASS_PASSWORD`：生徒に伝える合言葉（自由に決めてOK）
- `NEXT_PUBLIC_TEACHER_PASSWORD`：教師用ダッシュボードの合言葉（生徒用とは別のものに）

### 3. ローカルで動作確認

```bash
npm install
npm run dev
```

http://localhost:3000 を開いて、出席番号＋合言葉でログインできるか確認してください。

### 4. Vercelにデプロイ

以前作られたリスニングアプリと同じ要領で、GitHubリポジトリにpush → Vercelでインポート → 上記の環境変数をVercelのプロジェクト設定にも同じように追加、で公開できます。

## ファイル構成

```
pages/
  index.js          ログイン画面
  select.js          G1/G2/G3選択画面（進捗バッジ表示）
  grammar/[id].js     Step1〜3のメイン画面（1つのGにつき1ページ）
  teacher.js          教師用ダッシュボード
components/
  Quiz.js             選択式クイズの共通部品（Step1のL/R/W、Step2のWパターン練習で共用）
  HelpButton.js        ヘルプボタン（どのページにも出せる）
lib/
  supabase.js          Supabaseクライアント
  session.js           ログイン状態の保存（ブラウザのlocalStorageのみ・サーバー保存なし）
sql/
  schema.sql            テーブル定義
  seed_quiz_questions.sql  U4G1〜U4G4の問題データ（gen_seed.pyで生成）
  gen_seed.py            問題データを編集したいときは、このスクリプトの中身を直接編集して再実行
```

## 問題を追加・修正したいとき

`sql/gen_seed.py` の中の各配列（`g1_l`, `g1_r`, `g1_w` など）を編集して、

```bash
python3 sql/gen_seed.py
```

を再実行すると `sql/seed_quiz_questions.sql` が更新されます。それをSupabaseのSQL Editorで再実行すれば反映されます（`delete from quiz_questions;` を先に実行するので、既存データは洗い替えされます）。

## 今の実装で簡略化している点（今後の拡張候補）

- **認証**：出席番号＋クラス共通の合言葉のみ。友達に合言葉を教えれば他人としてログインは可能ですが、成績に関わらない理解度チェックなので、今回はこの強度で割り切っています。より厳密にしたい場合は、生徒ごとに個別パスワードを振る／Supabase Authの本格的な仕組みに置き換えることもできます。
- **Speaking（Step2）の採点**：自動採点はしておらず、「言えたらチェック」の自己申告＋自己録画のみです。録画データ自体はこのアプリでは保存していません（タブレットのカメラアプリ等、別途保存を前提にしています）。
- **音声**：ブラウザの読み上げ機能（Web Speech API）を使っています。イヤホン・マイクがあれば聞き取りやすいです。発音の自然さは端末・ブラウザに依存します。
- **Step3の採点**：自動判定はしておらず、入力された英文をSupabaseに保存するのみです。内容の確認は教師がダッシュボード経由でSupabaseのTable Editorを直接見るか、別途エクスポートして確認してください（ダッシュボードにStep3の回答一覧を表示する機能は未実装です）。

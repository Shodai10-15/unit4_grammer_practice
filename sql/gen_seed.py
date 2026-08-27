# Unit4 確認問題データ生成スクリプト
# U4G1: must/mustn't　U4G2: have to/don't have to　U4G3: 動名詞(目的語)　U4G4: 動名詞(主語)
def esc(s):
    if s is None:
        return "null"
    return "'" + str(s).replace("'", "''") + "'"

rows = []

def add(gid, grammar, step, skill, qtype, question, a, b, c, d, correct, note, sort):
    rows.append((f"{grammar}-{gid}", grammar, step, skill, qtype, question, a, b, c, d, correct, note, sort))

# =========================================================
# U4G1: must / mustn't（義務・禁止）テーマ：学校・安全のルール
# =========================================================
g1_l = [
    ("L1","You must leave the building quickly when the alarm rings.","避難しなければならない","避難してはいけない","避難しなくてもよい","避難したい","A","must/mustn'tの意味を正しく聞き取れるか問う"),
    ("L2","You mustn't run near the swimming pool.","走ってはいけない","走らなければならない","走らなくてもよい","走りたい","A",""),
    ("L3","You mustn't talk loudly in the library.","話してはいけない","話さなければならない","話さなくてもよい","話したい","A",""),
    ("L4","You must finish your homework by Friday.","終わらせなければならない","終わらせてはいけない","終わらせなくてもよい","終わらせたい","A",""),
    ("L5","You mustn't eat peanuts if you have an allergy.","食べてはいけない","食べなければならない","食べなくてもよい","食べたい","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g1_l):
    add(qid,"U4G1",1,"L","音声",q,a,b,c,d,cor,note,i)

g1_r = [
    ("R1","You must leave the building quickly when the alarm rings.","すぐに建物を出なければならない","すぐに建物を出てはいけない","すぐに建物を出なくてもよい","すぐに建物に入りたい","A","must/mustn'tの意味を正しく読み取れるか問う"),
    ("R2","You mustn't run near the swimming pool.","プールの近くを走ってはいけない","プールの近くを走らなければならない","プールの近くを走らなくてもよい","プールの近くで泳ぎたい","A",""),
    ("R3","You must finish your homework by Friday.","金曜までに宿題を終えなければならない","金曜までに宿題を終えてはいけない","金曜までに宿題を終えなくてもよい","金曜までに宿題を始めたい","A",""),
    ("R4","You mustn't eat peanuts if you have an allergy.","アレルギーがあるなら食べてはいけない","アレルギーがあるなら食べなければならない","アレルギーがあるなら食べなくてもよい","アレルギーがあるなら食べたい","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g1_r):
    add(qid,"U4G1",1,"R","問題文",q,a,b,c,d,cor,note,i)

g1_w = [
    ("W1","You ___ leave the building quickly when the alarm rings.","must","避難は義務"),
    ("W2","You ___ run near the swimming pool.","mustn't","禁止"),
    ("W3","You ___ talk loudly in the library.","mustn't","禁止"),
    ("W4","You ___ finish your homework by Friday.","must","義務"),
    ("W5","You ___ eat peanuts if you have an allergy.","mustn't","禁止"),
]
for i,(qid,q,correct,note) in enumerate(g1_w):
    add(qid,"U4G1",1,"W","記述",q,None,None,None,None,correct,note,i)

g1_s = [
    ("S1","You must be quiet during class.","授業中は静かにしなければなりません。"),
    ("S2","You mustn't take pictures here.","ここで写真を撮ってはいけません。"),
    ("S3","You must finish your homework today.","宿題を今日終わらせなければなりません。"),
    ("S4","You mustn't run in the pool.","プールの中で走ってはいけません。"),
    ("S5","You must go to bed early.","早く寝なければなりません。"),
]
for i,(qid,q,jp) in enumerate(g1_s):
    add(qid,"U4G1",2,"S","ディクテーション＋シャドーイング",q,None,None,None,None,None,jp,i)

g1_p = [
    ("P1","授業中は静かにしなければなりません。","You must be quiet during class."),
    ("P2","ここで写真を撮ってはいけません。","You mustn't take pictures here."),
    ("P3","宿題を今日終わらせなければなりません。","You must finish your homework today."),
    ("P4","プールの中で走ってはいけません。","You mustn't run in the pool."),
    ("P5","早く寝なければなりません。","You must go to bed early."),
]
for i,(qid,jp,en) in enumerate(g1_p):
    add(qid,"U4G1",2,"W","和文英訳＋発話",jp,None,None,None,None,en,"",i)

# =========================================================
# U4G2: have to / don't have to（必要・不要）テーマ：週末の予定
# =========================================================
g2_l = [
    ("L1","It's a holiday, so you don't have to go to school today.","学校に行く必要はない","学校に行く必要がある","学校に行ってはいけない","学校に行きたい","A","have to/don't have toの意味を正しく聞き取れるか問う"),
    ("L2","Since it's raining, we have to take an umbrella.","傘を持っていく必要がある","傘を持っていく必要はない","傘を持っていってはいけない","傘を持っていきたい","A",""),
    ("L3","The test is optional, so you don't have to take it.","受ける必要はない","受ける必要がある","受けてはいけない","受けたい","A",""),
    ("L4","She doesn't have to wake up early on Sundays.","早起きする必要はない","早起きする必要がある","早起きしてはいけない","早起きしたい","A",""),
    ("L5","We have to wear helmets when we ride bikes.","ヘルメットが必要","ヘルメットは不要","ヘルメットは禁止","ヘルメットが欲しい","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g2_l):
    add(qid,"U4G2",1,"L","音声",q,a,b,c,d,cor,note,i)

g2_r = [
    ("R1","It's a holiday, so you don't have to go to school today.","今日は学校に行く必要はない","今日は学校に行く必要がある","今日は学校に行ってはいけない","今日は学校に行きたい","A","have to/don't have toの意味を正しく読み取れるか問う"),
    ("R2","Since it's raining, we have to take an umbrella.","雨なので傘を持っていく必要がある","雨なので傘を持っていく必要はない","雨なので傘を持っていってはいけない","雨なので傘を買いたい","A",""),
    ("R3","She doesn't have to wake up early on Sundays.","彼女は日曜日早起きする必要はない","彼女は日曜日早起きする必要がある","彼女は日曜日早起きしてはいけない","彼女は日曜日早起きしたい","A",""),
    ("R4","We have to wear helmets when we ride bikes.","自転車に乗るときヘルメットが必要","自転車に乗るときヘルメットは不要","自転車に乗るときヘルメットは禁止","自転車に乗るときヘルメットが欲しい","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g2_r):
    add(qid,"U4G2",1,"R","問題文",q,a,b,c,d,cor,note,i)

g2_w = [
    ("W1","It's a holiday, so you ___ go to school today.","don't have to","不要"),
    ("W2","Since it's raining, we ___ take an umbrella.","have to","必要"),
    ("W3","The test is optional, so you ___ take it.","don't have to","不要"),
    ("W4","She ___ wake up early on Sundays.","doesn't have to","不要・3人称"),
    ("W5","We ___ wear helmets when we ride bikes.","have to","必要"),
]
for i,(qid,q,correct,note) in enumerate(g2_w):
    add(qid,"U4G2",1,"W","記述",q,None,None,None,None,correct,note,i)

g2_s = [
    ("S1","You don't have to go to school today.","今日は学校に行く必要はありません。"),
    ("S2","We have to take an umbrella.","私たちは傘を持っていく必要があります。"),
    ("S3","She doesn't have to wake up early on Sundays.","彼女は毎週日曜日に早起きする必要はありません。"),
    ("S4","We have to wear helmets when we ride bikes.","自転車に乗るときはヘルメットをかぶる必要があります。"),
    ("S5","You don't have to take this test.","このテストは受ける必要はありません。"),
]
for i,(qid,q,jp) in enumerate(g2_s):
    add(qid,"U4G2",2,"S","ディクテーション＋シャドーイング",q,None,None,None,None,None,jp,i)

g2_p = [
    ("P1","今日は学校に行く必要はありません。","You don't have to go to school today."),
    ("P2","私たちは傘を持っていく必要があります。","We have to take an umbrella."),
    ("P3","彼女は毎週日曜日に早起きする必要はありません。","She doesn't have to wake up early on Sundays."),
    ("P4","自転車に乗るときはヘルメットをかぶる必要があります。","We have to wear helmets when we ride bikes."),
    ("P5","このテストは受ける必要はありません。","You don't have to take this test."),
]
for i,(qid,jp,en) in enumerate(g2_p):
    add(qid,"U4G2",2,"W","和文英訳＋発話",jp,None,None,None,None,en,"",i)

# =========================================================
# U4G3: 動名詞（目的語）テーマ：趣味・習慣
# =========================================================
g3_l = [
    ("L1","I enjoy playing the guitar.","楽しんでいる","終えた","やめてほしい","練習している","A","動名詞を使った動詞の意味を正しく聞き取れるか問う"),
    ("L2","He finished writing his essay.","書き終えた","書くのを楽しんでいる","書くのをやめた","書く練習をしている","A",""),
    ("L3","Please stop talking during the movie.","話すのをやめて","話すのを楽しんで","話し終えて","話す練習をして","A",""),
    ("L4","She practices singing every day.","歌う練習をしている","歌うのをやめた","歌い終えた","歌うのを楽しんでいる","A",""),
    ("L5","We avoid eating too much sugar.","食べ過ぎを避けている","食べ過ぎを楽しんでいる","食べ終えた","食べる練習をしている","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g3_l):
    add(qid,"U4G3",1,"L","音声",q,a,b,c,d,cor,note,i)

g3_r = [
    ("R1","I enjoy playing the guitar.","ギターを弾くことを楽しんでいる","ギターを弾き終えた","ギターを弾くのをやめた","ギターを弾く練習をしている","A","動名詞を使った動詞の意味を正しく読み取れるか問う"),
    ("R2","He finished writing his essay.","彼はエッセイを書き終えた","彼はエッセイを書くのを楽しんでいる","彼はエッセイを書くのをやめた","彼はエッセイを書く練習をしている","A",""),
    ("R3","She practices singing every day.","彼女は毎日歌う練習をしている","彼女は毎日歌うのをやめた","彼女は毎日歌い終える","彼女は毎日歌うのを楽しんでいる","A",""),
    ("R4","We avoid eating too much sugar.","私たちは砂糖の食べ過ぎを避けている","私たちは砂糖の食べ過ぎを楽しんでいる","私たちは砂糖を食べ終えた","私たちは砂糖を食べる練習をしている","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g3_r):
    add(qid,"U4G3",1,"R","問題文",q,a,b,c,d,cor,note,i)

g3_w = [
    ("W1","I enjoy ___ the guitar.（play）","playing","楽しむ"),
    ("W2","He finished ___ his essay.（write）","writing","終える"),
    ("W3","Please stop ___ during the movie.（talk）","talking","やめる"),
    ("W4","She practices ___ every day.（sing）","singing","練習する"),
    ("W5","We avoid ___ too much sugar.（eat）","eating","避ける"),
]
for i,(qid,q,correct,note) in enumerate(g3_w):
    add(qid,"U4G3",1,"W","記述",q,None,None,None,None,correct,note,i)

g3_s = [
    ("S1","I enjoy playing the guitar.","私はギターを弾くことを楽しんでいます。"),
    ("S2","He finished writing his essay.","彼はエッセイを書き終えました。"),
    ("S3","Please stop talking during the movie.","映画の間は話すのをやめてください。"),
    ("S4","She practices singing every day.","彼女は毎日歌う練習をしています。"),
    ("S5","We avoid eating too much sugar.","私たちは砂糖を取りすぎるのを避けています。"),
]
for i,(qid,q,jp) in enumerate(g3_s):
    add(qid,"U4G3",2,"S","ディクテーション＋シャドーイング",q,None,None,None,None,None,jp,i)

g3_p = [
    ("P1","私はギターを弾くことを楽しんでいます。","I enjoy playing the guitar."),
    ("P2","彼はエッセイを書き終えました。","He finished writing his essay."),
    ("P3","映画の間は話すのをやめてください。","Please stop talking during the movie."),
    ("P4","彼女は毎日歌う練習をしています。","She practices singing every day."),
    ("P5","私たちは砂糖を取りすぎるのを避けています。","We avoid eating too much sugar."),
]
for i,(qid,jp,en) in enumerate(g3_p):
    add(qid,"U4G3",2,"W","和文英訳＋発話",jp,None,None,None,None,en,"",i)

# =========================================================
# U4G4: 動名詞（主語）テーマ：一般的な意見・真実
# =========================================================
g4_l = [
    ("L1","Swimming is good exercise.","泳ぐこと","読むこと","遊ぶこと","学ぶこと","A","主語になっている動名詞を正しく聞き取れるか問う"),
    ("L2","Reading books makes you smarter.","本を読むこと","本を書くこと","本を売ること","本を探すこと","A",""),
    ("L3","Playing video games can be fun.","ゲームをすること","ゲームを作ること","ゲームを売ること","ゲームを直すこと","A",""),
    ("L4","Learning English is important.","英語を学ぶこと","英語を教えること","英語を話すこと","英語を書くこと","A",""),
    ("L5","Helping others makes people happy.","他人を助けること","他人を待つこと","他人を探すこと","他人を招くこと","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g4_l):
    add(qid,"U4G4",1,"L","音声",q,a,b,c,d,cor,note,i)

g4_r = [
    ("R1","Swimming is good exercise.","泳ぐことは良い運動だ","泳ぐことは危険だ","泳ぐことは簡単だ","泳ぐことは退屈だ","A","主語になっている動名詞の意味を正しく読み取れるか問う"),
    ("R2","Reading books makes you smarter.","本を読むことはあなたを賢くする","本を読むことはあなたを疲れさせる","本を読むことはあなたを眠くする","本を読むことはあなたを忙しくする","A",""),
    ("R3","Playing video games can be fun.","ゲームをすることは楽しいことがある","ゲームをすることは危険なことがある","ゲームをすることは高くつくことがある","ゲームをすることは難しいことがある","A",""),
    ("R4","Learning English is important.","英語を学ぶことは大切だ","英語を学ぶことは簡単だ","英語を学ぶことは不要だ","英語を学ぶことは退屈だ","A",""),
]
for i,(qid,q,a,b,c,d,cor,note) in enumerate(g4_r):
    add(qid,"U4G4",1,"R","問題文",q,a,b,c,d,cor,note,i)

g4_w = [
    ("W1","___ is good exercise.（swim）","Swimming","主語になる動名詞"),
    ("W2","___ books makes you smarter.（read）","Reading","主語になる動名詞"),
    ("W3","___ video games can be fun.（play）","Playing","主語になる動名詞"),
    ("W4","___ English is important.（learn）","Learning","主語になる動名詞"),
    ("W5","___ others makes people happy.（help）","Helping","主語になる動名詞"),
]
for i,(qid,q,correct,note) in enumerate(g4_w):
    add(qid,"U4G4",1,"W","記述",q,None,None,None,None,correct,note,i)

g4_s = [
    ("S1","Swimming is good exercise.","泳ぐことは良い運動です。"),
    ("S2","Reading books makes you smarter.","本を読むことはあなたを賢くします。"),
    ("S3","Playing video games can be fun.","テレビゲームをすることは楽しいことがあります。"),
    ("S4","Learning English is important.","英語を学ぶことは大切です。"),
    ("S5","Helping others makes people happy.","他人を助けることは人々を幸せにします。"),
]
for i,(qid,q,jp) in enumerate(g4_s):
    add(qid,"U4G4",2,"S","ディクテーション＋シャドーイング",q,None,None,None,None,None,jp,i)

g4_p = [
    ("P1","泳ぐことは良い運動です。","Swimming is good exercise."),
    ("P2","本を読むことはあなたを賢くします。","Reading books makes you smarter."),
    ("P3","テレビゲームをすることは楽しいことがあります。","Playing video games can be fun."),
    ("P4","英語を学ぶことは大切です。","Learning English is important."),
    ("P5","他人を助けることは人々を幸せにします。","Helping others makes people happy."),
]
for i,(qid,jp,en) in enumerate(g4_p):
    add(qid,"U4G4",2,"W","和文英訳＋発話",jp,None,None,None,None,en,"",i)

lines = ["-- 自動生成: Unit4 確認問題データ", "delete from quiz_questions;"]
for (id_, grammar, step, skill, qtype, question, a,b,c,d, correct, note, sort) in rows:
    vals = [esc(id_), esc(grammar), step, esc(skill), esc(qtype), esc(question),
            esc(a), esc(b), esc(c), esc(d), esc(correct), esc(note), sort]
    lines.append(
        "insert into quiz_questions (id, grammar, step, skill, qtype, question, choice_a, choice_b, choice_c, choice_d, correct, note, sort_order) values (%s);"
        % ", ".join(str(v) for v in vals)
    )

with open("/home/claude/app/unit4-quiz/sql/seed_quiz_questions.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"generated {len(rows)} rows")

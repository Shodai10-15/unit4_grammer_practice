import random

N = 40
random.seed()
used = set()
passwords = {}
for i in range(1, N + 1):
    seat = f"{i:02d}"
    while True:
        pw = f"{random.randint(0, 9999):04d}"
        if pw not in used:
            used.add(pw)
            passwords[seat] = pw
            break

lines = ["-- 生徒ごとのパスワードを設定する（既存の氏名は上書きしません）"]
for seat, pw in passwords.items():
    lines.append(
        f"insert into students (seat_number, name, password) values ('{seat}', '{seat}番', '{pw}') "
        f"on conflict (seat_number) do update set password = excluded.password;"
    )

with open("set_passwords.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

import json
with open("passwords.json", "w", encoding="utf-8") as f:
    json.dump(passwords, f, ensure_ascii=False, indent=2)

print("generated", len(passwords), "passwords")

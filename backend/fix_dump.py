from pathlib import Path
import re

def split_sql_list(text: str):
    items = []
    cur = []
    in_quote = False
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "'":
            cur.append(ch)
            if in_quote and i + 1 < len(text) and text[i + 1] == "'":
                cur.append("'")
                i += 1
            else:
                in_quote = not in_quote
        elif ch == "," and not in_quote:
            items.append("".join(cur).strip())
            cur = []
        else:
            cur.append(ch)
        i += 1
    if cur:
        items.append("".join(cur).strip())
    return items

src = Path("local_wallet_dump.sql").read_text(encoding="utf-8", errors="ignore")

# remove users inserts entirely
src = re.sub(r"INSERT INTO public\.users\s*\(.*?\);\s*", "", src, flags=re.DOTALL)

# rewrite accounts inserts to drop current_balance and ledger_balance
def repl_accounts(m):
    cols = split_sql_list(m.group(1))
    vals = split_sql_list(m.group(2))
    drop = {"current_balance", "ledger_balance"}
    keep_idx = [i for i, c in enumerate(cols) if c not in drop]
    cols2 = [cols[i] for i in keep_idx]
    vals2 = [vals[i] for i in keep_idx]
    return f"INSERT INTO public.accounts ({', '.join(cols2)}) VALUES ({', '.join(vals2)});\n"

src = re.sub(
    r"INSERT INTO public\.accounts\s*\((.*?)\)\s*VALUES\s*\((.*?)\);\s*",
    repl_accounts,
    src,
    flags=re.DOTALL,
)

Path("local_wallet_filtered.sql").write_text(src, encoding="utf-8")
print("Wrote local_wallet_filtered.sql")